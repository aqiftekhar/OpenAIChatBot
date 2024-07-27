import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import formidable, { Fields, Files } from 'formidable';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import Tesseract from 'tesseract.js';
import { IncomingMessage } from 'http';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function GET() {
  console.log('GET /api/upload called');
  return NextResponse.json({"message":"hello world"});
}

export async function POST(req: NextRequest) {
  console.log('POST /api/upload called');
  try {
    const { fields, files }: { fields: Fields, files: Files } = await new Promise((resolve, reject) => {
      const form = formidable({ multiples: true });
      form.parse(req.body as unknown as IncomingMessage, (err, fields: Fields, files: Files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    const input = Array.isArray(fields.input)? fields.input.join(' ') : fields.input;

    if (!input &&!files.files) {
      return new NextResponse('Please provide an input or upload files.', { status: 400 });
    }

    if (!isHealthcareQuery(input!)) {
      return new NextResponse("I am a doctor bot, I don't know what you are talking about. Please share medical or healthcare-related issues if there are any.", { status: 400 });
    }

    let responseText = '';

    if (files.files) {
      const uploadedFiles = Array.isArray(files.files)? files.files : [files.files];
      for (const file of uploadedFiles) {
        const content = await getFileContent(file);
        const fileResponse = await processInput(content);
        responseText += `\n\nFile: ${file.originalFilename}\nSummary: ${fileResponse}`;
      }
    }

    const inputResponse = await processInput(input!);
    responseText += `\n\nInput: ${input}\nResponse: ${inputResponse}`;

    return new NextResponse(responseText);
  } catch (error) {
    console.error('Error processing the request:', error);
    return new NextResponse('Error processing the request', { status: 500 });
  }
}

const isHealthcareQuery = (input: string) => {
  const keywords = ['prescription', 'ymptoms', 'edical', 'health', 'eport', 'kin', 'baldness', 'feel', 'feeling'];
  return keywords.some(keyword => input.toLowerCase().includes(keyword));
};

const generatePrompt = (input: string) => {
  return `You are a healthcare bot. Only respond to healthcare-related queries. If a user shares symptoms, generate a prescription. If a user asks to analyze a medical report or shares a picture of a medical issue, respond appropriately.\n\nUser: ${input}\nHealthcare Bot:`;
};

const processInput = async (input: string) => {
  try {
    const response = await openai.completions.create({
      model: 'gpt-3.5-turbo',
      prompt: generatePrompt(input),
      max_tokens: 150,
    });

    return response.choices[0].text.trim();
  } catch (error) {
    throw error; // Rethrow the error
  }
};

const getFileContent = async (file: formidable.File): Promise<string> => {
  const fileContent = fs.readFileSync(file.filepath);

  if (file.mimetype === 'application/pdf') {
    const pdfData = await pdfParse(fileContent);
    console.log("PDF DATA = ", pdfData.text);
    
    return pdfData.text;
  } else if (file.mimetype && file.mimetype.startsWith('image/')) {
    const { data: { text } } = await Tesseract.recognize(fileContent);
    console.log("Image Text = ", text);
    
    return text;
  } else {
    return 'Unsupported file type';
  }
};