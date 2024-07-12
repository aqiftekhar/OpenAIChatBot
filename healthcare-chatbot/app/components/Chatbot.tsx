"use client";

import { useState, useEffect, useRef } from 'react';

const Chatbot = () => {
    const [messages, setMessages] = useState<{ text: string; user: boolean }[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Scroll to bottom when new messages are added
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = { text: input, user: true };
        setMessages([...messages, userMessage]);

        setLoading(true);
        try {
            const botResponse = await getBotResponse(input);
            setMessages([...messages, userMessage, { text: botResponse, user: false }]);
        } catch (error: any) {
            // console.error('Error fetching bot response:', error.message, error.stack);
            setMessages([...messages, userMessage, { text: 'Error fetching response. Please try again.', user: false }]);
        } finally {
            setInput('');
            setLoading(false);
        }
    };

    const getBotResponse = async (input: string) => {
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ input }),
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }

            const data = await response.text();
            return data;
        } catch (error) {
            throw error;
        }
    };

    return (
        <>
            {messages.map((message, index) => (
                <div
                    key={index}
                    className={`p-3 rounded-lg max-w-xs mb-2 ${message.user ? 'bg-blue-500 text-white self-end text-right' : 'bg-gray-200 text-gray-800 self-start text-left'}`}
                    style={{ wordBreak: 'break-word', marginLeft: message.user ? 'auto' : '0', marginRight: message.user ? '0' : 'auto' }}
                >
                    {message.text}
                </div>
            ))}
            {loading && (
                <div className="p-3 bg-gray-300 rounded-lg text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-blue-500"></div>
                </div>
            )}
            <div ref={endOfMessagesRef} />
            <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg rounded-t-lg border-t border-gray-200 p-4">
                <div className="flex items-center">
                    <input
                        type="text"
                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Type your message here"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <button onClick={handleSend} className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                        Send
                    </button>
                </div>
            </div>
        </>
    );
};

export default Chatbot;
