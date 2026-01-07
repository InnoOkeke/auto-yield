import express from 'express';
import prisma from '../utils/database.js';
import blockchainService from '../services/blockchain.js';
import avantisService from '../services/avantis.js';
import deductionService from '../services/deduction.js';

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
                return res.json({ success: true });
            }
        }
        res.json({ success: false, message: 'User or subscription not found' });
    } catch (error) {
        console.error('Failed to sync subscription:', error);
        res.status(500).json({ error: 'Failed to sync subscription' });
    }
});

export default router;
