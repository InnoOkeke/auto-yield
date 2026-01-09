import express from 'express';
import prisma from '../utils/database.js';
import notificationService from '../services/notification.js';

const router = express.Router();

/**
 * POST /api/farcaster/webhook
 * Receives webhook events from Farcaster
 * This is called automatically when users enable/disable notifications in Warpcast
 */
router.post('/webhook', async (req, res) => {
    try {
        console.log('📱 Received Farcaster webhook:', JSON.stringify(req.body, null, 2));

        const { event, fid, notificationDetails } = req.body;

        // Handle notification enabled event
        if (event === 'frame.added' && notificationDetails) {
            const { url, token } = notificationDetails;

            console.log(`🔔 User FID ${fid} enabled notifications`);

            // Find or create user by FID
            let user = await prisma.user.findUnique({
                where: { farcasterFid: parseInt(fid) },
            });

            if (!user) {
                // Create user if doesn't exist
                user = await prisma.user.create({
                    data: {
                        farcasterFid: parseInt(fid),
                        walletAddress: `0x${Date.now()}`, // Temporary placeholder
                        notificationsEnabled: true,
                    },
                });
                console.log(`✨ Created new user for FID ${fid}`);
            }

            // Save notification credentials
            await notificationService.saveNotificationCredentials(
                user.id,
                url,
                token
            );

            console.log(`✅ Saved notification credentials for FID ${fid}`);
        }

        // Handle notification disabled event
        if (event === 'frame.removed') {
            console.log(`🔕 User FID ${fid} disabled notifications`);

            const user = await prisma.user.findUnique({
                where: { farcasterFid: parseInt(fid) },
            });

            if (user) {
                await notificationService.disableNotifications(user.id);
                console.log(`✅ Disabled notifications for FID ${fid}`);
            }
        }

        // Always return 200 to acknowledge receipt
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('❌ Error processing Farcaster webhook:', error);
        // Still return 200 to prevent Farcaster from retrying
        res.status(200).json({ success: false, error: error.message });
    }
});

export default router;
