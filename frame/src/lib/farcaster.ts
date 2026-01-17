'use client';

import { sdk } from '@farcaster/miniapp-sdk';
import axios from 'axios';

// Initialize SDK and export for use across the app
export const farcasterSDK = sdk;

// Helper to check if running in mini-app context
export function isFarcasterContext(): boolean {
    if (typeof window === 'undefined') return false;

    // Check if we're in a Farcaster Mini App
    return Boolean(sdk.context);
}

// Helper to get user context from mini-app
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

// ========= NOTIFICATION FUNCTIONS =========

/**
 * IMPORTANT: Farcaster notifications work via manifest file (farcaster.json)
 * Users enable notifications in their Farcaster client settings
 * When enabled, Farcaster sends notification tokens to your backend webhook
 * 
 * The backend receives:
 * - notificationUrl: URL to send notifications to
 * - token: Auth token for notifications
 * 
 * This should be configured in your farcaster.json manifest:
 * {
 *   "notificationUrl": "https://your-backend.com/api/farcaster/notifications"
 * }
 */

/**
 * Enable notifications in backend
 * Call this when user clicks enable in the UI
 * Backend will save the notification credentials received from Farcaster webhooks
 */
export async function enableNotifications(
    walletAddress: string,
    fid: number
): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

        // 1. Call backend to initialize (optional but ensures user exists)
        await axios.post(`${backendUrl}/api/notifications/enable`, {
            walletAddress,
            fid,
        });

        // 2. Prompt user to add frame with notifications if SDK is available
        if (typeof window !== 'undefined' && farcasterSDK.actions.addFrame) {
            try {
                await farcasterSDK.actions.addFrame();
            } catch (sdkError) {
                console.warn('Farcaster SDK addFrame failed or cancelled:', sdkError);
            }
        }

        return {
            success: true,
            message: 'Notifications enablement requested'
        };
    } catch (error: any) {
        console.error('Failed to enable notifications in backend:', error);
        return {
            success: false,
            error: error.response?.data?.error || error.message,
        };
    }
}

/**
 * Disable notifications
 */
export async function disableNotifications(
    walletAddress: string,
    fid: number
): Promise<{ success: boolean; error?: string }> {
    try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

        const response = await axios.delete(`${backendUrl}/api/notifications/disable`, {
            data: { walletAddress, fid },
        });

        return { success: response.data.success };
    } catch (error: any) {
        console.error('Failed to disable notifications:', error);
        return {
            success: false,
            error: error.response?.data?.error || error.message,
        };
    }
}

/**
 * Check notification status
 */
export async function getNotificationStatus(
    walletAddress: string,
    fid: number
): Promise<{ enabled: boolean; configured: boolean; error?: string }> {
    try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

        const response = await axios.get(`${backendUrl}/api/notifications/status`, {
            params: { walletAddress, fid },
        });

        return {
            enabled: response.data.enabled,
            configured: response.data.configured,
        };
    } catch (error: any) {
        console.error('Failed to get notification status:', error);
        return {
            enabled: false,
            configured: false,
            error: error.response?.data?.error || error.message,
        };
    }
}

/**
 * Send test notification
 */
export async function sendTestNotification(
    walletAddress: string,
    fid: number
): Promise<{ success: boolean; error?: string }> {
    try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

        const response = await axios.post(`${backendUrl}/api/notifications/test`, {
            walletAddress,
            fid,
        });

        return { success: response.data.success };
    } catch (error: any) {
        console.error('Failed to send test notification:', error);
        return {
            success: false,
            error: error.response?.data?.error || error.message,
        };
    }
}

/**
 * Share streak to feed (client-agnostic)
 */
export async function shareStreak(streak: number) {
    const text = `I'm on a ${streak}-day savings streak with AutoYield! 🔥\n\nAutomating my DeFi savings on Base.`;
    const appUrl = process.env.NEXT_PUBLIC_FRAME_URL || 'https://autoyield.app';

    if (isFarcasterContext()) {
        try {
            // Use SDK composeCast for client-agnostic sharing
            await sdk.actions.composeCast({
                text,
                embeds: [appUrl],
            });
        } catch (e) {
            console.error('Failed to compose cast via SDK:', e);
        }
    } else {
        // Fallback for non-mini-app context
        const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(appUrl)}`;
        window.open(shareUrl, '_blank');
    }
}

/**
 * Share daily/weekly summary to feed (client-agnostic)
 */
export interface SummaryData {
    totalSaved: string;
    yieldEarned: string;
    currentStreak: number;
    period: 'daily' | 'weekly';
}

export async function shareSummary(data: SummaryData) {
    const periodLabel = data.period === 'daily' ? 'Today' : 'This Week';
    const emoji = data.period === 'daily' ? '📊' : '📈';

    const text = `${emoji} My AutoYield ${periodLabel}:

💵 Saved: $${data.totalSaved} USDC
✨ Yield earned: $${data.yieldEarned}
🔥 Streak: ${data.currentStreak} days

Automating my savings on Base with AutoYield! 🚀`;

    const appUrl = process.env.NEXT_PUBLIC_FRAME_URL || 'https://autoyield.app';

    if (isFarcasterContext()) {
        try {
            // Use SDK composeCast for client-agnostic sharing
            await sdk.actions.composeCast({
                text,
                embeds: [appUrl],
            });
        } catch (e) {
            console.error('Failed to compose cast via SDK:', e);
        }
    } else {
        // Fallback for non-mini-app context
        const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(appUrl)}`;
        window.open(shareUrl, '_blank');
    }
}

