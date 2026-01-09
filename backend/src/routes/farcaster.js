import express from 'express';
import prisma from '../utils/database.js';
import notificationService from '../services/notification.js';

const router = express.Router();

/**
 * POST /api/farcaster/webhook
 * Receives webhook events from Farcaster
 * Handles notification token delivery when users enable notifications
 */
router.post('/webhook', async (req, res) => {
    try {
        console.log('Received Farcaster webhook:', JSON.stringify(req.body, null, 2));

        const { event, fid, notificationDetails } = req.body;

        // Handle notification enabled event
        if (event === 'frame.added' && notificationDetails) {
            const { url, token } = notificationDetails;

            // Find user by FID
            const user = await prisma.user.findUnique({
                where: { farcasterFid: parseInt(fid) },
            });

            if (user) {
                // Save notification credentials
                await notificationService.saveNotificationCredentials(
                    user.id,
                    url,
                    token
                );

                console.log(`✅ Saved notification credentials for user ${user.username || user.walletAddress}`);
            } else {
                console.warn(`User with FID ${fid} not found in database`);
            }
        }

        // Handle notification disabled event
        if (event === 'frame.removed') {
            const user = await prisma.user.findUnique({
                where: { farcasterFid: parseInt(fid) },
            });

            if (user) {
                await notificationService.disableNotifications(user.id);
                console.log(`🔕 Disabled notifications for user ${user.username || user.walletAddress}`);
            }
        }

        // Always return 200 to acknowledge receipt
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error processing Farcaster webhook:', error);
        // Still return 200 to prevent Farcaster from retrying
        res.status(200).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/farcaster/notifications
 * This endpoint is called BY Farcaster when delivering notifications
 * Not used by our app - just a placeholder
 */
router.post('/notifications', async (req, res) => {
    console.log('Farcaster notification delivery webhook called:', req.body);
    res.status(200).json({ success: true });
});

export default router;
