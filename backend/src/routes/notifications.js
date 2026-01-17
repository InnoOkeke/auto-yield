/**
 * Notification Routes - Migrated to Convex
 * Farcaster notification webhook handling
 */

import express from 'express';
import convex, { api } from '../utils/database.js';
import notificationService from '../services/notification.js';

const router = express.Router();

/**
 * POST /api/farcaster/webhook
 * Receives webhook events from Farcaster
 * Called automatically when users enable/disable notifications in their client
 */
router.post('/webhook', async (req, res) => {
    try {
        console.log('📱 Received webhook:', JSON.stringify(req.body, null, 2));

        const { event, fid, notificationDetails } = req.body;

        // Handle notification enabled event
        if ((event === 'frame_added' || event === 'frame.added') && notificationDetails) {
            const { url, token } = notificationDetails;

            console.log(`🔔 User FID ${fid} enabled notifications`);

            // Find or create user by FID
            let user = await convex.query(api.users.getByFid, { farcasterFid: parseInt(fid) });

            if (!user) {
                // Create user if doesn't exist
                const userId = await convex.mutation(api.users.upsert, {
                    farcasterFid: parseInt(fid),
                    walletAddress: `0x_fid_${fid}`, // Placeholder until linked
                });
                user = await convex.query(api.users.getById, { userId });
                console.log(`✨ Created new user for FID ${fid}`);
            }

            // Save notification credentials
            await convex.mutation(api.users.enableNotifications, {
                walletAddress: user.walletAddress,
                notificationUrl: url,
                notificationToken: token,
            });

            console.log(`✅ Saved notification credentials for FID ${fid}`);
        }

        // Handle notification disabled event
        if (event === 'frame_removed' || event === 'frame.removed') {
            console.log(`🔕 User FID ${fid} disabled notifications`);

            const user = await convex.query(api.users.getByFid, { farcasterFid: parseInt(fid) });

            if (user) {
                await convex.mutation(api.users.disableNotifications, {
                    walletAddress: user.walletAddress,
                });
                console.log(`✅ Disabled notifications for FID ${fid}`);
            }
        }

        // Always return 200 to acknowledge receipt
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('❌ Error processing webhook:', error);
        // Still return 200 to prevent retries
        res.status(200).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/farcaster/status
 * Check if notifications are enabled for a user
 */
router.get('/status', async (req, res) => {
    try {
        const { walletAddress, fid } = req.query;

        let user;
        if (fid) {
            user = await convex.query(api.users.getByFid, { farcasterFid: parseInt(fid) });
        } else if (walletAddress) {
            user = await convex.query(api.users.getByWallet, { walletAddress: walletAddress.toLowerCase() });
        }

        if (!user) {
            return res.json({ enabled: false, configured: false });
        }

        const status = await notificationService.getNotificationStatus(user.walletAddress);
        res.json(status);
    } catch (error) {
        console.error('Failed to get notification status:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/farcaster/test
 * Send a test notification
 */
router.post('/test', async (req, res) => {
    try {
        const { walletAddress, fid } = req.body;

        let user;
        if (fid) {
            user = await convex.query(api.users.getByFid, { farcasterFid: parseInt(fid) });
        } else if (walletAddress) {
            user = await convex.query(api.users.getByWallet, { walletAddress: walletAddress.toLowerCase() });
        }

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const result = await notificationService.sendNotification(
            user,
            '🔔 Test Notification',
            'This is a test notification from AutoYield! It seems everything is working correctly. 🚀',
            process.env.FRONTEND_URL || 'https://autoyield.vercel.app'
        );

        res.json(result);
    } catch (error) {
        console.error('Failed to send test notification:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/farcaster/enable
 * Manually trigger notification enablement sync
 */
router.post('/enable', async (req, res) => {
    try {
        const { walletAddress, fid } = req.body;

        let user;
        if (fid) {
            user = await convex.query(api.users.getByFid, { farcasterFid: parseInt(fid) });
        } else if (walletAddress) {
            user = await convex.query(api.users.getByWallet, { walletAddress: walletAddress.toLowerCase() });
        }

        if (!user && walletAddress) {
            await convex.mutation(api.users.upsert, {
                farcasterFid: fid ? parseInt(fid) : 0,
                walletAddress: walletAddress.toLowerCase(),
            });
        }

        res.json({ success: true, message: 'Notification sync initialized' });
    } catch (error) {
        console.error('Failed to enable notifications:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
