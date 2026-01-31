import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { blockchainService } from "./lib/blockchain";
import { avantisService } from "./lib/avantis";
import { notificationService } from "./lib/notification";
import { deductionService } from "./lib/deduction";
import { ethers } from "ethers";

/**
 * GET /api/stats -> query(api.app.getPlatformStats)
 */
export const getPlatformStats = query({
    args: {},
    handler: async (ctx): Promise<{
        totalUsers: number;
        activeSubscriptions: number;
        pausedSubscriptions: number;
        totalDailySavings: number;
        vault: {
            totalPooled: number;
            totalValue: number;
            apy: number;
        } | null;
        timestamp: string;
    }> => {
        const stats = await ctx.runQuery(api.stats.getStats);
        return {
            ...stats,
            timestamp: new Date().toISOString(),
        };
    }
});



/**
 * GET /api/user/yield/:address -> action(api.app.getUserYield)
 */
export const getUserYield = action({
    args: { walletAddress: v.string() },
    handler: async (ctx, args): Promise<{
        walletAddress: string;
        lpShares: string;
        totalDeposited: string;
        currentValue: string;
        yieldEarned: string;
        yieldPercentage: string;
        daysActive: number;
        transactionCount: number;
    } | null> => {
        const address = args.walletAddress.toLowerCase();
        // Call users.getUserProfile (moved to break circular dependency)
        const userProfile = await ctx.runQuery(api.users.getUserProfile, { walletAddress: address });

        if (!userProfile || !userProfile.subscription) return null;

        const transactions = await ctx.runQuery(api.transactions.getByUser, { userId: userProfile._id });

        return await avantisService.getUserYieldData(
            address,
            userProfile.subscription,
            userProfile,
            transactions
        );
    }
});

/**
 * POST /api/sync-user -> action(api.app.syncUser)
 */
export const syncUser = action({
    args: {
        farcasterFid: v.number(),
        walletAddress: v.string(),
        username: v.optional(v.string())
    },
    handler: async (ctx, args): Promise<{ success: boolean; userId: string }> => {
        const walletAddress = args.walletAddress.toLowerCase();

        // Upsert user
        const userId = await ctx.runMutation(api.users.upsert, {
            farcasterFid: args.farcasterFid,
            walletAddress,
            username: args.username,
        });

        const user = await ctx.runQuery(api.users.getById, { userId });
        if (!user) throw new Error("User not found after sync");

        // On-chain check
        const onChainSub = await blockchainService.getSubscription(walletAddress);

        if (onChainSub && onChainSub.isActive) {
            const existingSub = await ctx.runQuery(api.subscriptions.getByWallet, { walletAddress });

            if (!existingSub) {
                await ctx.runMutation(api.subscriptions.create, {
                    userId: user._id,
                    walletAddress,
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

        return { success: true, userId };
    }
});

/**
 * POST /api/subscription/resume -> action(api.app.resumeSubscription)
 */
export const resumeSubscription = action({
    args: { walletAddress: v.string() },
    handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
        const address = args.walletAddress.toLowerCase();
        const sub = await ctx.runQuery(api.subscriptions.getByWallet, { walletAddress: address });

        if (!sub) return { success: false, error: "Subscription not found" };
        if (!sub.isPaused) return { success: false, error: "Not paused" };

        const balanceRes = await deductionService.checkLowBalance(sub);

        if (balanceRes.shouldPause) {
            return {
                success: false,
                error: `Insufficient balance. You have $${balanceRes.balance} but need at least $${balanceRes.required}`
            };
        }

        await ctx.runMutation(api.subscriptions.resume, { walletAddress: address });

        const user = await ctx.runQuery(api.users.getById, { userId: sub.userId });
        if (user?.notificationsEnabled) {
            await notificationService.sendManualResumeNotification(user);
        }

        return { success: true };
    }
});
