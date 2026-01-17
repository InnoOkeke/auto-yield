/**
 * Notification Service - Migrated to Convex
 * Handles push notifications via Farcaster webhook
 */

import axios from 'axios';
import convex, { api } from '../utils/database.js';

export class NotificationService {
    /**
     * Send push notification via Farcaster webhook
     * @param {Object} user - User object with notificationUrl and notificationToken
     * @param {string} title - Notification title
     * @param {string} message - Notification message/body
     * @param {string} targetUrl - URL to open when notification is clicked
     */
    async sendNotification(user, title, message, targetUrl) {
        try {
            // Check if user has notifications enabled
            if (!user.notificationsEnabled || !user.notificationUrl || !user.notificationToken) {
                console.log(`Notifications not enabled for user ${user._id}`);

                if (!user.notificationsEnabled) {
                    return { success: false, reason: 'notifications_disabled', error: 'Notifications are not enabled for this user' };
                }
                if (!user.notificationUrl || !user.notificationToken) {
                    return {
                        success: false,
                        reason: 'credentials_missing',
                        error: 'Notification credentials not yet received. Please enable notifications in your client settings for this Mini App.'
                    };
                }
            }

            console.log(`📱 Sending notification to user ${user.username || user.walletAddress}`);

            // Send POST request to notification webhook
            const response = await axios.post(
                user.notificationUrl,
                {
                    title,
                    body: message,
                    target_url: targetUrl,
                },
                {
                    headers: {
                        Authorization: `Bearer ${user.notificationToken}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 5000,
                }
            );

            console.log(`✅ Notification sent successfully to ${user.username || user.walletAddress}`);

            return {
                success: true,
                response: response.data,
            };
        } catch (error) {
            console.error(`❌ Failed to send notification to user ${user._id}:`, error.message);

            // Handle specific error cases
            if (error.response?.status === 401) {
                // Token expired or invalid - disable notifications for this user
                await this.disableNotificationsByWallet(user.walletAddress);
                console.warn(`Disabled notifications for user ${user._id} due to auth error`);
            }

            return {
                success: false,
                error: error.message,
                statusCode: error.response?.status,
            };
        }
    }

    /**
     * Save notification credentials for a user by wallet address
     * @param {string} walletAddress - User wallet address
     * @param {string} notificationUrl - Farcaster webhook URL
     * @param {string} notificationToken - Auth token
     */
    async saveNotificationCredentials(walletAddress, notificationUrl, notificationToken) {
        try {
            await convex.mutation(api.users.enableNotifications, {
                walletAddress,
                notificationUrl,
                notificationToken,
            });

            console.log(`✅ Saved notification credentials for wallet ${walletAddress}`);
            return { success: true };
        } catch (error) {
            console.error(`Failed to save notification credentials for wallet ${walletAddress}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Disable notifications for a user by wallet address
     * @param {string} walletAddress - User wallet address
     */
    async disableNotificationsByWallet(walletAddress) {
        try {
            await convex.mutation(api.users.disableNotifications, { walletAddress });

            console.log(`✅ Disabled notifications for wallet ${walletAddress}`);
            return { success: true };
        } catch (error) {
            console.error(`Failed to disable notifications for wallet ${walletAddress}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Check if notifications are enabled for a user
     * @param {string} walletAddress - User wallet address
     */
    async getNotificationStatus(walletAddress) {
        try {
            const user = await convex.query(api.users.getByWallet, { walletAddress });

            return {
                enabled: user?.notificationsEnabled || false,
                configured: Boolean(user?.notificationUrl),
            };
        } catch (error) {
            console.error(`Failed to get notification status for wallet ${walletAddress}:`, error);
            return { enabled: false, configured: false };
        }
    }

    /**
     * Send deduction success notification
     */
    async sendDeductionNotification(user, amount, streak = 0) {
        let message = `Successfully saved ${amount} USDC today! Keep building your yield.`;
        if (streak > 1) {
            message = `Successfully saved ${amount} USDC today! 🔥 ${streak}-day streak! Keep it up!`;
        }
        return this.sendNotification(
            user,
            '💰 AutoYield Savings',
            message,
            process.env.FRONTEND_URL || 'https://autoyield.vercel.app/dashboard'
        );
    }

    /**
     * Send deposit notification
     */
    async sendDepositNotification(user, amount) {
        return this.sendNotification(
            user,
            '✅ Deposit Successful',
            `${amount} USDC deposited to your AutoYield vault!`,
            process.env.FRONTEND_URL || 'https://autoyield.vercel.app/dashboard'
        );
    }

    /**
     * Send withdrawal notification
     */
    async sendWithdrawalNotification(user, amount) {
        return this.sendNotification(
            user,
            '💸 Withdrawal Complete',
            `${amount} USDC withdrawn from your vault.`,
            process.env.FRONTEND_URL || 'https://autoyield.vercel.app/dashboard'
        );
    }

    /**
     * Send subscription activated notification
     */
    async sendSubscriptionActivatedNotification(user, dailyAmount) {
        return this.sendNotification(
            user,
            '🎯 AutoYield Activated',
            `Daily savings of ${dailyAmount} USDC enabled. Your future self will thank you!`,
            process.env.FRONTEND_URL || 'https://autoyield.vercel.app/dashboard'
        );
    }

    /**
     * Send yield earnings summary notification
     */
    async sendYieldSummaryNotification(user, totalYield, period) {
        return this.sendNotification(
            user,
            '📊 Yield Summary',
            `You earned ${totalYield} USDC in yield ${period}! 🚀`,
            process.env.FRONTEND_URL || 'https://autoyield.vercel.app/dashboard'
        );
    }

    /**
     * Smart Pause notification - friendly and non-alarming
     */
    async sendSmartPauseNotification(user, currentBalance, requiredAmount) {
        return this.sendNotification(
            user,
            '💤 We\'ve Got Your Back',
            `We paused your daily save so you don't overdraft. Fund your wallet with at least $${requiredAmount} USDC to resume. Your streak is safe!`,
            process.env.FRONTEND_URL || 'https://autoyield.vercel.app/dashboard'
        );
    }

    /**
     * Auto-resume notification - celebratory
     */
    async sendAutoResumeNotification(user) {
        return this.sendNotification(
            user,
            '🎉 You\'re Back in Action!',
            `Your wallet is funded and daily saves have resumed. Keep building that streak!`,
            process.env.FRONTEND_URL || 'https://autoyield.vercel.app/dashboard'
        );
    }

    /**
     * Manual resume notification - confirmation
     */
    async sendManualResumeNotification(user) {
        return this.sendNotification(
            user,
            '✅ Resumed Successfully',
            `Your daily saves are back on. Let's keep building!`,
            process.env.FRONTEND_URL || 'https://autoyield.vercel.app/dashboard'
        );
    }

    /**
     * Auto-increase notification - premium feature celebration
     */
    async sendAutoIncreaseNotification(user, oldAmount, newAmount) {
        return this.sendNotification(
            user,
            '📈 Daily Savings Increased!',
            `Your auto-increase rule kicked in! Daily savings: $${oldAmount} → $${newAmount}. Building wealth on autopilot! 🚀`,
            process.env.FRONTEND_URL || 'https://autoyield.vercel.app/settings'
        );
    }
}

export default new NotificationService();
