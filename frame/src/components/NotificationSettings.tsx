'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import {
    enableNotifications,
    disableNotifications,
    getNotificationStatus,
    sendTestNotification,
    getFarcasterUser,
    isFarcasterContext,
} from '@/lib/farcaster';

export default function NotificationSettings() {
    const { address } = useAccount();
    const [isEnabled, setIsEnabled] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [fid, setFid] = useState<number | null>(null);
    const [isFarcaster, setIsFarcaster] = useState(false);

    // Check if in Farcaster context and get FID
    useEffect(() => {
        async function checkContext() {
            const inFarcaster = isFarcasterContext();
            setIsFarcaster(inFarcaster);

            if (inFarcaster) {
                const user = await getFarcasterUser();
                if (user?.fid) {
                    setFid(user.fid);
                }
            }
        }
        checkContext();
    }, []);

    // Load notification status
    useEffect(() => {
        async function loadStatus() {
            if (!address || !fid) return;

            try {
                const status = await getNotificationStatus(address, fid);
                setIsEnabled(status.enabled);
            } catch (error) {
                console.error('Failed to load notification status:', error);
            }
        }
        loadStatus();
    }, [address, fid]);

    const handleToggle = async () => {
        if (!address || !fid) {
            setStatusMessage('❌ Wallet not connected or invalid user');
            return;
        }

        setIsLoading(true);
        setStatusMessage('');

        try {
            if (!isEnabled) {
                // Enable notifications
                setStatusMessage('💾 Enabling notifications...');

                // Just tell backend to enable - Farcaster will send tokens via webhook
                const enableResult = await enableNotifications(address, fid);

                if (enableResult.success) {
                    setIsEnabled(true);
                    setStatusMessage('✅ Notifications enabled! Make sure notifications are enabled for this Mini App in your Warpcast settings.');

                    // Clear success message after 5 seconds
                    setTimeout(() => setStatusMessage(''), 5000);
                } else {
                    setStatusMessage(`❌ ${enableResult.error || 'Failed to enable notifications'}`);
                }
            } else {
                // Disable notifications
                setStatusMessage('🔕 Disabling notifications...');

                const result = await disableNotifications(address, fid);

                if (result.success) {
                    setIsEnabled(false);
                    setStatusMessage('✅ Notifications disabled');

                    // Clear message after 3 seconds
                    setTimeout(() => setStatusMessage(''), 3000);
                } else {
                    setStatusMessage(`❌ ${result.error}`);
                }
            }
        } catch (error: any) {
            console.error('Error toggling notifications:', error);
            setStatusMessage(`❌ ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTestNotification = async () => {
        if (!address || !fid || !isEnabled) return;

        setIsLoading(true);
        setStatusMessage('🧪 Sending test notification...');

        try {
            const result = await sendTestNotification(address, fid);

            if (result.success) {
                setStatusMessage('✅ Test notification sent! Check Warpcast.');
                setTimeout(() => setStatusMessage(''), 3000);
            } else {
                // Handle error - result.error might be undefined, so provide fallback
                const errorMsg = result.error || 'Notification credentials not yet received. Please enable notifications in Warpcast settings.';
                setStatusMessage(`❌ ${errorMsg}`);
            }
        } catch (error: any) {
            setStatusMessage(`❌ ${error.message || 'Failed to send test notification'}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Don't show if not in Farcaster
    if (!isFarcaster) {
        return null;
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        🔔 Push Notifications
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Get notified when you earn yield or when daily savings are deducted
                    </p>
                </div>

                {/* Toggle Switch */}
                <button
                    onClick={handleToggle}
                    disabled={isLoading || !address || !fid}
                    className={`
                        relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                        transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                        ${isEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}
                        ${isLoading || !address || !fid ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    role="switch"
                    aria-checked={isEnabled}
                >
                    <span
                        className={`
                            pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 
                            transition duration-200 ease-in-out
                            ${isEnabled ? 'translate-x-5' : 'translate-x-0'}
                        `}
                    />
                </button>
            </div>

            {/* Status Message */}
            {statusMessage && (
                <div className={`
                    mt-4 p-3 rounded-lg text-sm
                    ${statusMessage.includes('✅') ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200' : ''}
                    ${statusMessage.includes('❌') ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200' : ''}
                    ${statusMessage.includes('📱') || statusMessage.includes('💾') || statusMessage.includes('🔕') || statusMessage.includes('🧪')
                        ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200' : ''}
                `}>
                    {statusMessage}
                </div>
            )}

            {/* Test Button (only show when enabled) */}
            {isEnabled && !isLoading && (
                <button
                    onClick={handleTestNotification}
                    className="mt-4 w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 
                               rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                >
                    Send Test Notification
                </button>
            )}

            {/* Info Box */}
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                    <strong>📬 You&apos;ll receive notifications for:</strong>
                    <br />
                    • Daily savings deductions
                    <br />
                    • Manual deposits
                    <br />
                    • Withdrawal completions
                    <br />• Yield earnings summaries
                </p>
            </div>
        </div>
    );
}
