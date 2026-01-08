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
                return { success: false, reason: 'notifications_disabled' };
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
    async sendDeductionNotification(user, amount) {
        return this.sendNotification(
            user,
            '💰 AutoYield Savings',
            `Successfully saved ${amount} USDC today! Keep building your yield.`,
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
}

export default new NotificationService();
