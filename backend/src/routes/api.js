/**
 * API Routes - Migrated to Convex
 * Main API endpoints for the AutoYield backend
 */

import express from 'express';
import convex, { api } from '../utils/database.js';
import blockchainService from '../services/blockchain.js';
import avantisService from '../services/avantis.js';
import deductionService from '../services/deduction.js';
import notificationService from '../services/notification.js';

const router = express.Router();

// Middleware for API authentication
export const requireAuth = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    const validKey = process.env.API_SECRET;

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
        const [stats, vaultStats, deductionStats] = await Promise.all([
            convex.query(api.stats.getStats),
            avantisService.getVaultStats(),
            deductionService.getDeductionStats('24h'),
        ]);

        res.json({
            users: {
                total: stats.totalUsers,
                activeSubscriptions: stats.activeSubscriptions,
            },
            vault: vaultStats || stats.vault,
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

        const user = await convex.query(api.users.getByWallet, {
            walletAddress: address.toLowerCase()
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const subscription = await convex.query(api.subscriptions.getByUserId, {
            userId: user._id
        });

        const transactions = await convex.query(api.transactions.getByUser, {
            userId: user._id,
            limit: 10
        });

        const yieldData = await avantisService.getUserYieldData(address);

        res.json({
            user: { ...user, subscription, transactions },
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
            convex.query(api.subscriptions.getByWallet, {
                walletAddress: address.toLowerCase()
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
        const { limit = 50 } = req.query;

        const user = await convex.query(api.users.getByWallet, {
            walletAddress: address.toLowerCase()
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const transactions = await convex.query(api.transactions.getByUser, {
            userId: user._id,
            limit: parseInt(limit)
        });

        res.json({
            transactions,
            pagination: {
                total: transactions.length,
                limit: parseInt(limit),
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
        const userId = await convex.mutation(api.users.upsert, {
            farcasterFid,
            walletAddress: walletAddress.toLowerCase(),
            username,
        });

        const user = await convex.query(api.users.getById, { userId });

        // Fetch on-chain subscription
        const onChainSub = await blockchainService.getSubscription(walletAddress);

        if (onChainSub && onChainSub.isActive) {
            // Check if subscription exists
            const existingSub = await convex.query(api.subscriptions.getByWallet, {
                walletAddress: walletAddress.toLowerCase()
            });

            if (!existingSub) {
                // Create new subscription
                await convex.mutation(api.subscriptions.create, {
                    userId: user._id,
                    walletAddress: walletAddress.toLowerCase(),
                    dailyAmount: parseFloat(onChainSub.dailyAmount.toString()),
                });

                if (user.notificationsEnabled) {
                    await notificationService.sendSubscriptionActivatedNotification(
                        user,
                        onChainSub.dailyAmount.toString()
                    );
                }
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

        const user = await convex.query(api.users.getByWallet, {
            walletAddress: address.toLowerCase()
        });

        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        const onChainSub = await blockchainService.getSubscription(address);

        if (onChainSub) {
            const existingSub = await convex.query(api.subscriptions.getByWallet, {
                walletAddress: address.toLowerCase()
            });

            if (existingSub) {
                // Update existing
                await convex.mutation(api.subscriptions.updateDailyAmount, {
                    walletAddress: address.toLowerCase(),
                    dailyAmount: parseFloat(onChainSub.dailyAmount.toString()),
                });
            } else {
                // Create new
                await convex.mutation(api.subscriptions.create, {
                    userId: user._id,
                    walletAddress: address.toLowerCase(),
                    dailyAmount: parseFloat(onChainSub.dailyAmount.toString()),
                });

                if (user.notificationsEnabled) {
                    await notificationService.sendSubscriptionActivatedNotification(
                        user,
                        onChainSub.dailyAmount.toString()
                    );
                }
            }

            return res.json({ success: true });
        }

        res.json({ success: false, message: 'Subscription not found on-chain' });
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

        const subscription = await convex.query(api.subscriptions.getByWallet, {
            walletAddress: address.toLowerCase()
        });

        if (!subscription) {
            return res.status(404).json({ error: 'Subscription not found' });
        }

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

        const subscription = await convex.query(api.subscriptions.getByWallet, {
            walletAddress: address.toLowerCase()
        });

        if (!subscription) {
            return res.status(404).json({ error: 'Subscription not found' });
        }

        let nextIncreaseDate = null;
        if (subscription.autoIncreaseEnabled && subscription.lastAutoIncreaseAt) {
            const intervalDays = subscription.autoIncreaseIntervalDays || 30;
            nextIncreaseDate = new Date(subscription.lastAutoIncreaseAt + intervalDays * 24 * 60 * 60 * 1000);
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

        const parsedAmount = amount ? parseFloat(amount) : null;
        const parsedMaxAmount = maxAmount ? parseFloat(maxAmount) : null;

        if (parsedAmount !== null && parsedAmount <= 0) {
            return res.status(400).json({ error: 'Amount must be greater than 0' });
        }

        if (type === 'PERCENTAGE' && parsedAmount > 100) {
            return res.status(400).json({ error: 'Percentage cannot exceed 100%' });
        }

        const subscription = await convex.query(api.subscriptions.getByWallet, {
            walletAddress: address.toLowerCase()
        });

        if (!subscription) {
            return res.status(404).json({ error: 'Subscription not found' });
        }

        await convex.mutation(api.subscriptions.updateAutoIncrease, {
            walletAddress: address.toLowerCase(),
            autoIncreaseEnabled: enabled,
            autoIncreaseType: enabled ? type : undefined,
            autoIncreaseAmount: enabled ? parsedAmount : undefined,
            autoIncreaseIntervalDays: intervalDays || 30,
            autoIncreaseMaxAmount: parsedMaxAmount,
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

/**
 * GET /api/challenges/user/:userId
 * Get challenges for a user
 */
router.get('/challenges/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const challenges = await convex.query(api.challenges.getMyChallenges, {
            userId
        });

        // Enrich with participants list for each challenge
        const enrichedChallenges = await Promise.all(
            challenges.map(async (challenge) => {
                const fullChallenge = await convex.query(api.challenges.getById, {
                    challengeId: challenge._id
                });
                return fullChallenge;
            })
        );

        res.json(enrichedChallenges);
    } catch (error) {
        console.error('Failed to get user challenges:', error);
        res.status(500).json({ error: 'Failed to fetch challenges' });
    }
});

/**
 * GET /api/savings/total/:userId
 * Get total manual savings for a user
 */
router.get('/savings/total/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const total = await convex.query(api.manual_savings.getTotalManualSavings, {
            userId
        });

        res.json({ total });
    } catch (error) {
        console.error('Failed to get manual savings:', error);
        res.status(500).json({ error: 'Failed to fetch manual savings' });
    }
});

export default router;
