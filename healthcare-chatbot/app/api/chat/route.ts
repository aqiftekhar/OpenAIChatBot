import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export const config = {
  api: {
    bodyParser: true, // Enable body parsing for JSON input
  },
};

export async function GET() {
    return NextResponse.json({"message":"hello world"})
}

export async function POST(req: NextRequest) {
  try {
    const { input } = await req.json();

    if (!input) {
      return new NextResponse('Please provide an input.', { status: 400 });
    }

    if (!isHealthcareQuery(input)) {
      return new NextResponse("I am a doctor bot, I don't know what you are talking about. Please share medical or healthcare-related issues if there are any.", { status: 400 });
    }

    const responseText = await processInput(input);
    return new NextResponse(responseText);
  } catch (error) {
    console.error('Error processing the request:', error);
    return new NextResponse('Error processing the request', { status: 500 });
  }
}

const isHealthcareQuery = (input: string) => {
  const keywords = ['prescription', 'symptoms', 'medical', 'health', 'report', 'kin', 'baldness', 'feel', 'feeling'];
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