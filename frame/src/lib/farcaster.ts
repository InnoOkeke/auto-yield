'use client';

import { sdk } from '@farcaster/miniapp-sdk';
import axios from 'axios';

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

// ========= NOTIFICATION FUNCTIONS =========

/**
 * Request notification permission from Farcaster
 * Returns notification credentials to save in backend
 */
export async function requestNotificationPermission(): Promise<{
    success: boolean;
    notificationUrl?: string;
    token?: string;
    error?: string;
}> {
    try {
        if (!isFarcasterContext()) {
            return {
                success: false,
                error: 'Not in Farcaster context',
            };
        }

        console.log('Requesting notification permission from Farcaster...');

        // Request notification permission via Farcaster SDK
        const result = await sdk.actions.addNotification({
            name: 'AutoYield Earnings',
            url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/farcaster/notifications`,
        });

        if (result && result.notificationDetails) {
            return {
                success: true,
                notificationUrl: result.notificationDetails.url,
                token: result.notificationDetails.token,
            };
        }

        return {
            success: false,
            error: 'No notification details returned',
        };
    } catch (error: any) {
        console.error('Failed to request notification permission:', error);
        return {
            success: false,
            error: error.message || 'Failed to request permission',
        };
    }
}

/**
 * Enable notifications in backend
 * Saves the notification credentials from Farcaster
 */
export async function enableNotifications(
    walletAddress: string,
    fid: number,
    notificationUrl: string,
    notificationToken: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

        const response = await axios.post(`${backendUrl}/api/notifications/enable`, {
            walletAddress,
            fid,
            notificationUrl,
            notificationToken,
        });

        return { success: response.data.success };
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
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

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
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

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
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

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
