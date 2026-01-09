import express from 'express';
import notificationService from '../services/notification.js';
import prisma from '../utils/database.js';

const router = express.Router();

/**
 * POST /api/notifications/enable
 * Mark that user wants notifications enabled
 * Actual credentials will come from Farcaster webhook when user enables in Warpcast
 */
router.post('/enable', async (req, res) => {
    try {
        const { userId, fid, walletAddress } = req.body;

        // Find user by FID or wallet address
        let user;
        if (userId) {
            user = await prisma.user.findUnique({ where: { id: userId } });
        } else if (fid) {
            user = await prisma.user.findUnique({ where: { farcasterFid: parseInt(fid) } });
        } else if (walletAddress) {
            user = await prisma.user.findUnique({ where: { walletAddress } });
        }

        // If user doesn't exist, create them
        if (!user) {
            if (!fid && !walletAddress) {
                return res.status(400).json({
                    success: false,
                    error: 'Either fid or walletAddress is required to create user',
                });
            }

            user = await prisma.user.create({
                data: {
                    farcasterFid: fid ? parseInt(fid) : 0,
                    walletAddress: walletAddress || `0x${Date.now()}`, // Temporary placeholder if no wallet
                    notificationsEnabled: true,
                },
            });

            console.log(`✅ Created new user with FID ${fid} or wallet ${walletAddress}`);
        } else {
            // Just mark as wanting notifications enabled
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    notificationsEnabled: true,
                },
            });
        }

        return res.json({
            success: true,
            message: 'Notifications preference saved. Please enable notifications for this Mini App in your Warpcast settings.',
        });
    } catch (error) {
        console.error('Error enabling notifications:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * DELETE /api/notifications/disable
 * Disable notifications for a user
 */
router.delete('/disable', async (req, res) => {
    try {
        const { userId, fid, walletAddress } = req.body;

        // Find user
        let user;
        if (userId) {
            user = await prisma.user.findUnique({ where: { id: userId } });
        } else if (fid) {
            user = await prisma.user.findUnique({ where: { farcasterFid: parseInt(fid) } });
        } else if (walletAddress) {
            user = await prisma.user.findUnique({ where: { walletAddress } });
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }

        // Disable notifications
        const result = await notificationService.disableNotifications(user.id);

        if (result.success) {
            return res.json({
                success: true,
                message: 'Notifications disabled successfully',
            });
        } else {
            return res.status(500).json({
                success: false,
                error: result.error,
            });
        }
    } catch (error) {
        console.error('Error disabling notifications:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * GET /api/notifications/status
 * Get notification status for a user
 */
router.get('/status', async (req, res) => {
    try {
        const { userId, fid, walletAddress } = req.query;

        // Find user
        let user;
        if (userId) {
            user = await prisma.user.findUnique({ where: { id: userId } });
        } else if (fid) {
            user = await prisma.user.findUnique({ where: { farcasterFid: parseInt(fid) } });
        } else if (walletAddress) {
            user = await prisma.user.findUnique({ where: { walletAddress } });
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }

        // Get notification status
        const status = await notificationService.getNotificationStatus(user.id);

        return res.json({
            success: true,
            ...status,
        });
    } catch (error) {
        console.error('Error getting notification status:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/notifications/test
 * Send a test notification (for debugging)
 */
router.post('/test', async (req, res) => {
    try {
        const { userId, fid, walletAddress } = req.body;

        // Find user
        let user;
        if (userId) {
            user = await prisma.user.findUnique({ where: { id: userId } });
        } else if (fid) {
            user = await prisma.user.findUnique({ where: { farcasterFid: parseInt(fid) } });
        } else if (walletAddress) {
            user = await prisma.user.findUnique({ where: { walletAddress } });
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }

        // Send test notification
        const result = await notificationService.sendNotification(
            user,
            '🧪 Test Notification',
            'This is a test notification from AutoYield!',
            process.env.FRONTEND_URL || 'https://autoyield.vercel.app/dashboard'
        );

        return res.json(result);
    } catch (error) {
        console.error('Error sending test notification:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

export default router;
