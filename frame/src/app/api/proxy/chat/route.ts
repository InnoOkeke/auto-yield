import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const backendUrl = process.env.NEXT_PUBLIC_API_URL;
        const apiKey = process.env.API_SECRET;

        if (!apiKey) {
            return NextResponse.json(
                { error: 'Server configuration error: missing API_SECRET' },
                { status: 500 }
            );
        }

        const response = await axios.post(`${backendUrl}/api/chat/message`, body, {
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json'
            }
        });

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('Proxy chat error:', error.message);
        return NextResponse.json(
            { error: 'Failed to send message' },
            { status: error.response?.status || 500 }
        );
    }
}
