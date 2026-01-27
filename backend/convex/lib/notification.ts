// Notification service for sending push notifications
// Note: We removed the direct database mutations here because in Convex, 
// actions calls mutations. It is cleaner to keep this service purely for external IO (Axios)
// and handle DB updates in the regular logic.

export class NotificationService {
    async sendNotification(user: any, title: string, message: string, targetUrl: string) {
        try {
            if (!user.notificationsEnabled || !user.notificationUrl || !user.notificationToken) {
                return { success: false, reason: 'disabled_or_missing_creds' };
            }

            const response = await fetch(user.notificationUrl, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${user.notificationToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title,
                    body: message,
                    target_url: targetUrl,
                }),
            });

            if (!response.ok) {
                // Return 401 status etc
                return { success: false, statusCode: response.status };
            }

            return { success: true };
        } catch (error: any) {
            console.error(`❌ Failed to send notification to user ${user._id}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    async sendDeductionNotification(user: any, amount: string, streak = 0) {
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

    async sendSmartPauseNotification(user: any, balance: string, required: string) {
        return this.sendNotification(
            user,
            '💤 We\'ve Got Your Back',
            `We paused your daily save so you don't overdraft. Fund your wallet with at least $${required} USDC to resume.`,
            process.env.FRONTEND_URL || 'https://autoyield.vercel.app/dashboard'
        );
    }

    async sendAutoResumeNotification(user: any) {
        return this.sendNotification(
            user,
            '🎉 You\'re Back in Action!',
            `Your wallet is funded and daily saves have resumed.`,
            process.env.FRONTEND_URL || 'https://autoyield.vercel.app/dashboard'
        );
    }

    async sendAutoIncreaseNotification(user: any, oldAmount: string, newAmount: string) {
        return this.sendNotification(
            user,
            '📈 Daily Savings Increased!',
            `Your auto-increase rule kicked in! Daily savings: $${oldAmount} → $${newAmount}.`,
            process.env.FRONTEND_URL || 'https://autoyield.vercel.app/settings'
        );
    async sendDepositNotification(user: any, amount: string) {
            return this.sendNotification(
                user,
                '✅ Deposit Successful',
                `${amount} USDC deposited to your AutoYield vault!`,
                process.env.FRONTEND_URL || 'https://autoyield.vercel.app/dashboard'
            );
        }

    async sendWithdrawalNotification(user: any, amount: string) {
            return this.sendNotification(
                user,
                '💸 Withdrawal Complete',
                `${amount} USDC withdrawn from your vault.`,
                process.env.FRONTEND_URL || 'https://autoyield.vercel.app/dashboard'
            );
        }

    async sendSubscriptionActivatedNotification(user: any, dailyAmount: string) {
            return this.sendNotification(
                user,
                '🎯 AutoYield Activated',
                `Daily savings of ${dailyAmount} USDC enabled. Your future self will thank you!`,
                process.env.FRONTEND_URL || 'https://autoyield.vercel.app/dashboard'
            );
        }

    async sendYieldSummaryNotification(user: any, totalYield: string, period: string) {
            return this.sendNotification(
                user,
                '📊 Yield Summary',
                `You earned ${totalYield} USDC in yield ${period}! 🚀`,
                process.env.FRONTEND_URL || 'https://autoyield.vercel.app/dashboard'
            );
        }

    async sendManualResumeNotification(user: any) {
            return this.sendNotification(
                user,
                '✅ Resumed Successfully',
                `Your daily saves are back on. Let's keep building!`,
                process.env.FRONTEND_URL || 'https://autoyield.vercel.app/dashboard'
            );
        }
    }

    export const notificationService = new NotificationService();
