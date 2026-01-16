import axios from 'axios';
import prisma from '../utils/database.js';

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
                console.log(`Notifications not enabled for user ${user.id}`);

                // Return more specific error message
                if (!user.notificationsEnabled) {
                    return { success: false, reason: 'notifications_disabled', error: 'Notifications are not enabled for this user' };
                }
                if (!user.notificationUrl || !user.notificationToken) {
                    return {
                        success: false,
                        reason: 'credentials_missing',
                        error: 'Notification credentials not yet received from Farcaster. Please enable notifications in your Warpcast settings for this Mini App.'
                    };
                }
            }

            console.log(`📱 Sending notification to user ${user.username || user.walletAddress}`);

            // Send POST request to Farcaster notification webhook
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
                    timeout: 5000, // 5 second timeout
                }
            );

            console.log(`✅ Notification sent successfully to ${user.username || user.walletAddress}`);

            return {
                success: true,
                response: response.data,
            };
        } catch (error) {
            console.error(`❌ Failed to send notification to user ${user.id}:`, error.message);

            // Handle specific error cases
            if (error.response?.status === 401) {
                // Token expired or invalid - disable notifications for this user
                await this.disableNotifications(user.id);
                console.warn(`Disabled notifications for user ${user.id} due to auth error`);
            }

            return {
                success: false,
                error: error.message,
                statusCode: error.response?.status,
            };
        }
    }

    /**
     * Save notification credentials for a user
     * @param {string} userId - User ID
     * @param {string} notificationUrl - Farcaster webhook URL
     * @param {string} notificationToken - Auth token
     */
    async saveNotificationCredentials(userId, notificationUrl, notificationToken) {
        try {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    notificationUrl,
                    notificationToken,
                    notificationsEnabled: true,
                },
            });

            console.log(`✅ Saved notification credentials for user ${userId}`);
            return { success: true };
        } catch (error) {
            console.error(`Failed to save notification credentials for user ${userId}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Disable notifications for a user
     * @param {string} userId - User ID
     */
    async disableNotifications(userId) {
        try {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    notificationUrl: null,
                    notificationToken: null,
                    notificationsEnabled: false,
                },
            });

            console.log(`✅ Disabled notifications for user ${userId}`);
            return { success: true };
        } catch (error) {
            console.error(`Failed to disable notifications for user ${userId}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Check if notifications are enabled for a user
     * @param {string} userId - User ID
     */
    async getNotificationStatus(userId) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    notificationsEnabled: true,
                    notificationUrl: true,
                },
            });

            return {
                enabled: user?.notificationsEnabled || false,
                configured: Boolean(user?.notificationUrl),
            };
        } catch (error) {
            console.error(`Failed to get notification status for user ${userId}:`, error);
            return { enabled: false, configured: false };
        }
    }

    /**
     * Send deduction success notification
     * @param {Object} user - User object
     * @param {string|number} amount - Amount deducted
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
     * @param {Object} user - User object
     * @param {string|number} amount - Amount deposited
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
     * @param {Object} user - User object
     * @param {string|number} amount - Amount withdrawn
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
     * @param {Object} user - User object
     * @param {string|number} dailyAmount - Daily deduction amount
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
     * @param {Object} user - User object
     * @param {string|number} totalYield - Total yield earned
     * @param {string} period - Time period (e.g., 'this week', 'this month')
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
     * @param {Object} user - User object
     * @param {string} currentBalance - User's current USDC balance
     * @param {string} requiredAmount - Required amount for daily save
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
     * @param {Object} user - User object
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
     * @param {Object} user - User object
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
     * @param {Object} user - User object
     * @param {string} oldAmount - Previous daily amount
     * @param {string} newAmount - New daily amount
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
