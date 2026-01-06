import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const backendUrl = process.env.NEXT_PUBLIC_API_URL;
        const apiKey = process.env.API_SECRET;

        // In development, might not have key set, but warn
        if (!apiKey) {
            console.error('API_SECRET is missing in server environment');
            return NextResponse.json(
                { error: 'Server configuration error: missing API_SECRET' },
                { status: 500 }
            );
        }

        // Forward request to backend
        const response = await axios.post(`${backendUrl}/api/sync-user`, body, {
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json'
            }
        });

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('Proxy sync error:', error.message);
        return NextResponse.json(
            { error: error.response?.data?.error || 'Failed to sync user' },
            { status: error.response?.status || 500 }
        );
    }
}
