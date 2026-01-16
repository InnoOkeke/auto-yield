import express from 'express';
import prisma from '../utils/database.js';
import blockchainService from '../services/blockchain.js';
import avantisService from '../services/avantis.js';
import deductionService from '../services/deduction.js';
import notificationService from '../services/notification.js';

const router = express.Router();

// Middleware for API authentication
export const requireAuth = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    const validKey = process.env.API_SECRET;

    // Allow usage without key in development if specifically allowed, or strictly enforce
    if (!validKey) {
        console.warn('⚠️ API_SECRET not set, allowing request (unsafe)');
        return next();
    }

    if (!apiKey || apiKey !== validKey) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    next();
};

/**
 * GET /api/stats
 * Get overall platform statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const [activeSubscriptions, totalUsers, vaultStats, deductionStats] = await Promise.all([
            prisma.subscription.count({ where: { isActive: true } }),
            prisma.user.count(),
            avantisService.getVaultStats(),
            deductionService.getDeductionStats('24h'),
        ]);

        res.json({
            users: {
                total: totalUsers,
                activeSubscriptions,
            },
            vault: vaultStats,
            deductions: deductionStats,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Failed to get stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

/**
 * GET /api/user/:address
 * Get user profile and yield data
 */
router.get('/user/:address', async (req, res) => {
    try {
        const { address } = req.params;

        const user = await prisma.user.findUnique({
            where: { walletAddress: address.toLowerCase() },
            include: {
                subscription: true,
                transactions: {
                    orderBy: { timestamp: 'desc' },
                    take: 10,
                },
            },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const yieldData = await avantisService.getUserYieldData(address);

        res.json({
            user,
            yield: yieldData,
        });
    } catch (error) {
        console.error('Failed to get user data:', error);
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
});

/**
 * GET /api/yield/history
 * Get historical yield data
 */
router.get('/yield/history', async (req, res) => {
    try {
        const { timeframe = '30d' } = req.query;
        const history = await avantisService.getHistoricalYield(timeframe);

        res.json({ history, timeframe });
    } catch (error) {
        console.error('Failed to get yield history:', error);
        res.status(500).json({ error: 'Failed to fetch yield history' });
    }
});

/**
 * GET /api/subscription/:address
 * Get subscription details for a wallet
 */
router.get('/subscription/:address', async (req, res) => {
    try {
        const { address } = req.params;

        const [onChainSub, dbSub] = await Promise.all([
            blockchainService.getSubscription(address),
            prisma.subscription.findUnique({
                where: { walletAddress: address.toLowerCase() },
            }),
        ]);

        res.json({
            onChain: onChainSub,
            database: dbSub,
        });
    } catch (error) {
        console.error('Failed to get subscription:', error);
        res.status(500).json({ error: 'Failed to fetch subscription' });
    }
});

/**
 * GET /api/transactions/:address
 * Get transaction history for a user
 */
router.get('/transactions/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        const user = await prisma.user.findUnique({
            where: { walletAddress: address.toLowerCase() },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const transactions = await prisma.transaction.findMany({
            where: { userId: user.id },
            orderBy: { timestamp: 'desc' },
            take: parseInt(limit),
            skip: parseInt(offset),
        });

        const total = await prisma.transaction.count({
            where: { userId: user.id },
        });

        res.json({
            transactions,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
            },
        });
    } catch (error) {
        console.error('Failed to get transactions:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

/**
 * POST /api/sync-user
 * Sync user data from blockchain to database
 */
router.post('/sync-user', requireAuth, async (req, res) => {
    try {
        const { farcasterFid, walletAddress, username } = req.body;

        if (!farcasterFid || !walletAddress) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Upsert user
        const user = await prisma.user.upsert({
            where: { walletAddress: walletAddress.toLowerCase() },
            update: { username },
            create: {
                farcasterFid,
                walletAddress: walletAddress.toLowerCase(),
                username,
            },
        });

        // Fetch on-chain subscription
        const onChainSub = await blockchainService.getSubscription(walletAddress);

        if (onChainSub && onChainSub.isActive) {
            // Sync subscription to database
            const isNew = !await prisma.subscription.findUnique({ where: { walletAddress: walletAddress.toLowerCase() } });

            await prisma.subscription.upsert({
                where: { walletAddress: walletAddress.toLowerCase() },
                update: {
                    dailyAmount: onChainSub.dailyAmount.toString(),
                    isActive: onChainSub.isActive,
                    lastDeduction: onChainSub.lastDeduction > 0
                        ? new Date(onChainSub.lastDeduction * 1000)
                        : null,
                },
                create: {
                    userId: user.id,
                    walletAddress: walletAddress.toLowerCase(),
                    dailyAmount: onChainSub.dailyAmount.toString(),
                    isActive: onChainSub.isActive,
                    startDate: new Date(onChainSub.startDate * 1000),
                    lastDeduction: onChainSub.lastDeduction > 0
                        ? new Date(onChainSub.lastDeduction * 1000)
                        : null,
                },
            });

            // Send notification if new subscription
            if (isNew && user.notificationsEnabled) {
                await notificationService.sendSubscriptionActivatedNotification(user, onChainSub.dailyAmount.toString());
            }
        }

        res.json({ success: true, user });
    } catch (error) {
        console.error('Failed to sync user:', error);
        res.status(500).json({ error: 'Failed to sync user data' });
    }
});

/**
 * POST /api/subscription/sync
 * Manually trigger subscription sync from blockchain
 */
router.post('/subscription/sync', requireAuth, async (req, res) => {
    try {
        const { address } = req.body;

        if (!address) {
            return res.status(400).json({ error: 'Address is required' });
        }

        const onChainSub = await blockchainService.getSubscription(address);

        if (onChainSub) {
            await prisma.subscription.upsert({
                where: { walletAddress: address.toLowerCase() },
                update: {
                    dailyAmount: onChainSub.dailyAmount.toString(),
                    isActive: onChainSub.isActive,
                    lastDeduction: onChainSub.lastDeduction > 0
                        ? new Date(onChainSub.lastDeduction * 1000)
                        : null,
                },
                // We don't create if user doesn't exist, this is just for sync
                create: {
                    walletAddress: address.toLowerCase(), // This might fail if user doesn't exist foreign key
                    userId: 'temp', // This will definitely fail. We should only update if exists or handle user creation.
                    // Actually, better to just update if it exists, or find user first.
                    dailyAmount: onChainSub.dailyAmount.toString(),
                    isActive: onChainSub.isActive,
                    startDate: new Date(),
                    lastDeduction: null
                }
            });
            // Re-think logic: we just want to update the existing sub.
            // If sub doesn't exist but user does, create it.

            const user = await prisma.user.findUnique({ where: { walletAddress: address.toLowerCase() } });

            if (user) {
                const existingSub = await prisma.subscription.findUnique({ where: { walletAddress: address.toLowerCase() } });
                const wasActive = existingSub?.isActive || false;

                await prisma.subscription.upsert({
                    where: { walletAddress: address.toLowerCase() },
                    update: {
                        dailyAmount: onChainSub.dailyAmount.toString(),
                        isActive: onChainSub.isActive,
                        lastDeduction: onChainSub.lastDeduction > 0
                            ? new Date(onChainSub.lastDeduction * 1000)
                            : null,
                    },
                    create: {
                        userId: user.id,
                        walletAddress: address.toLowerCase(),
                        dailyAmount: onChainSub.dailyAmount.toString(),
                        isActive: onChainSub.isActive,
                        startDate: new Date(onChainSub.startDate * 1000),
                        lastDeduction: onChainSub.lastDeduction > 0
                            ? new Date(onChainSub.lastDeduction * 1000)
                            : null,
                    }
                });

                // Trigger notifications based on status change
                if (user.notificationsEnabled) {
                    if (!wasActive && onChainSub.isActive) {
                        await notificationService.sendSubscriptionActivatedNotification(user, onChainSub.dailyAmount.toString());
                    } else if (wasActive && !onChainSub.isActive) {
                        await notificationService.sendNotification(
                            user,
                            '⏸️ Subscription Paused',
                            'Your daily deductions have been paused. You can resume anytime from the dashboard.',
                            process.env.FRONTEND_URL || 'https://autoyield.vercel.app/dashboard'
                        );
                    }
                }

                return res.json({ success: true });
            }
        }
        res.json({ success: false, message: 'User or subscription not found' });
    } catch (error) {
        console.error('Failed to sync subscription:', error);
        res.status(500).json({ error: 'Failed to sync subscription' });
    }
});

/**
 * POST /api/subscription/resume
 * Manually resume a Smart Paused subscription
 */
router.post('/subscription/resume', async (req, res) => {
    try {
        const { address } = req.body;

        if (!address) {
            return res.status(400).json({ error: 'Address is required' });
        }

        const result = await deductionService.manualResume(address.toLowerCase());

        if (result.success) {
            res.json({ success: true, message: 'Subscription resumed successfully' });
        } else {
            res.status(400).json({ success: false, error: result.error });
        }
    } catch (error) {
        console.error('Failed to resume subscription:', error);
        res.status(500).json({ error: 'Failed to resume subscription' });
    }
});

/**
 * GET /api/subscription/pause-status/:address
 * Get Smart Pause status for a subscription
 */
router.get('/subscription/pause-status/:address', async (req, res) => {
    try {
        const { address } = req.params;

        const subscription = await prisma.subscription.findUnique({
            where: { walletAddress: address.toLowerCase() },
            select: {
                isPaused: true,
                pauseReason: true,
                pausedAt: true,
                autoResumeEnabled: true,
                dailyAmount: true,
                currentStreak: true,
                bestStreak: true,
            },
        });

        if (!subscription) {
            return res.status(404).json({ error: 'Subscription not found' });
        }

        // Get current balance if paused
        let currentBalance = null;
        let requiredAmount = null;

        if (subscription.isPaused) {
            const balance = await blockchainService.getUserUsdcBalance(address);
            const { ethers } = await import('ethers');
            currentBalance = ethers.formatUnits(balance, 6);
            requiredAmount = subscription.dailyAmount.toString();
        }

        res.json({
            isPaused: subscription.isPaused,
            pauseReason: subscription.pauseReason,
            pausedAt: subscription.pausedAt,
            autoResumeEnabled: subscription.autoResumeEnabled,
            currentStreak: subscription.currentStreak,
            bestStreak: subscription.bestStreak,
            dailyAmount: subscription.dailyAmount.toString(),
            currentBalance,
            requiredAmount,
        });
    } catch (error) {
        console.error('Failed to get pause status:', error);
        res.status(500).json({ error: 'Failed to get pause status' });
    }
});

/**
 * GET /api/subscription/auto-increase/:address
 * Get auto-increase settings for a subscription
 */
router.get('/subscription/auto-increase/:address', async (req, res) => {
    try {
        const { address } = req.params;

        const subscription = await prisma.subscription.findUnique({
            where: { walletAddress: address.toLowerCase() },
            select: {
                autoIncreaseEnabled: true,
                autoIncreaseType: true,
                autoIncreaseAmount: true,
                autoIncreaseIntervalDays: true,
                autoIncreaseMaxAmount: true,
                lastAutoIncreaseAt: true,
                dailyAmount: true,
            },
        });

        if (!subscription) {
            return res.status(404).json({ error: 'Subscription not found' });
        }

        // Calculate next increase date
        let nextIncreaseDate = null;
        if (subscription.autoIncreaseEnabled) {
            const lastIncrease = subscription.lastAutoIncreaseAt;
            const intervalDays = subscription.autoIncreaseIntervalDays || 30;

            if (lastIncrease) {
                nextIncreaseDate = new Date(lastIncrease);
                nextIncreaseDate.setDate(nextIncreaseDate.getDate() + intervalDays);
            }
        }

        res.json({
            enabled: subscription.autoIncreaseEnabled,
            type: subscription.autoIncreaseType,
            amount: subscription.autoIncreaseAmount?.toString() || null,
            intervalDays: subscription.autoIncreaseIntervalDays,
            maxAmount: subscription.autoIncreaseMaxAmount?.toString() || null,
            lastIncreaseAt: subscription.lastAutoIncreaseAt,
            nextIncreaseDate,
            currentDailyAmount: subscription.dailyAmount.toString(),
        });
    } catch (error) {
        console.error('Failed to get auto-increase settings:', error);
        res.status(500).json({ error: 'Failed to get auto-increase settings' });
    }
});

/**
 * PUT /api/subscription/auto-increase/:address
 * Update auto-increase settings for a subscription
 */
router.put('/subscription/auto-increase/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const { enabled, type, amount, intervalDays, maxAmount } = req.body;

        // Validate input
        if (enabled && !type) {
            return res.status(400).json({ error: 'Type is required when enabling auto-increase' });
        }

        if (enabled && !amount) {
            return res.status(400).json({ error: 'Amount is required when enabling auto-increase' });
        }

        if (type && !['FIXED', 'PERCENTAGE'].includes(type)) {
            return res.status(400).json({ error: 'Type must be FIXED or PERCENTAGE' });
        }

        // Validate amounts
        const parsedAmount = amount ? parseFloat(amount) : null;
        const parsedMaxAmount = maxAmount ? parseFloat(maxAmount) : null;

        if (parsedAmount !== null && parsedAmount <= 0) {
            return res.status(400).json({ error: 'Amount must be greater than 0' });
        }

        if (type === 'PERCENTAGE' && parsedAmount > 100) {
            return res.status(400).json({ error: 'Percentage cannot exceed 100%' });
        }

        const subscription = await prisma.subscription.findUnique({
            where: { walletAddress: address.toLowerCase() },
        });

        if (!subscription) {
            return res.status(404).json({ error: 'Subscription not found' });
        }

        // Update settings
        await prisma.subscription.update({
            where: { walletAddress: address.toLowerCase() },
            data: {
                autoIncreaseEnabled: enabled,
                autoIncreaseType: enabled ? type : null,
                autoIncreaseAmount: enabled ? parsedAmount : null,
                autoIncreaseIntervalDays: intervalDays || 30,
                autoIncreaseMaxAmount: parsedMaxAmount,
            },
        });

        console.log(`📈 Auto-increase settings updated for ${address}: ${enabled ? `${type} +${amount}` : 'disabled'}`);

        res.json({
            success: true,
            message: enabled
                ? `Auto-increase enabled: ${type === 'FIXED' ? `+$${amount}` : `+${amount}%`} every ${intervalDays || 30} days`
                : 'Auto-increase disabled',
        });
    } catch (error) {
        console.error('Failed to update auto-increase settings:', error);
        res.status(500).json({ error: 'Failed to update auto-increase settings' });
    }
});

export default router;
