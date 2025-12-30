'use client';

import { sdk } from '@farcaster/miniapp-sdk';

// Initialize SDK and export for use across the app
export const farcasterSDK = sdk;

// Helper to check if running in Farcaster context
export function isFarcasterContext(): boolean {
    if (typeof window === 'undefined') return false;

    // Check if we're in a Farcaster Mini App
    return Boolean(sdk.context);
}

// Helper to get Farcaster user context
export async function getFarcasterUser() {
    try {
        if (!isFarcasterContext()) return null;

        const context = await sdk.context;
        return context?.user || null;
    } catch (error) {
        console.error('Failed to get Farcaster user context:', error);
        return null;
    }
}
