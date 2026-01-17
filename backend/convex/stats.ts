import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============ YIELD SNAPSHOTS ============

// Get latest yield snapshot
export const getLatestSnapshot = query({
    handler: async (ctx) => {
        return await ctx.db
            .query("yieldSnapshots")
            .order("desc")
            .first();
    },
});

// Get snapshots for time range
export const getSnapshots = query({
    args: { limit: v.number() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("yieldSnapshots")
            .order("desc")
            .take(args.limit);
    },
});

// Create yield snapshot
export const createSnapshot = mutation({
    args: {
        totalPooled: v.number(),
        avantisShares: v.number(),
        totalValue: v.number(),
        apy: v.number(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("yieldSnapshots", args);
    },
});

// ============ RELAYER STATUS ============

// Get relayer status
export const getRelayerStatus = query({
    args: { address: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("relayerStatus")
            .withIndex("by_address", (q) => q.eq("address", args.address))
            .unique();
    },
});

// Update relayer status
export const updateRelayerStatus = mutation({
    args: {
        address: v.string(),
        ethBalance: v.number(),
        isHealthy: v.boolean(),
        alertSent: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("relayerStatus")
            .withIndex("by_address", (q) => q.eq("address", args.address))
            .unique();

        if (existing) {
            const updates: any = {
                ethBalance: args.ethBalance,
                isHealthy: args.isHealthy,
            };
            if (args.alertSent !== undefined) updates.alertSent = args.alertSent;

            await ctx.db.patch(existing._id, updates);
            return existing._id;
        }

        return await ctx.db.insert("relayerStatus", {
            address: args.address,
            ethBalance: args.ethBalance,
            isHealthy: args.isHealthy,
            alertSent: args.alertSent ?? false,
        });
    },
});

// ============ STATS ============

// Get overall stats
export const getStats = query({
    handler: async (ctx) => {
        const users = await ctx.db.query("users").collect();
        const activeSubscriptions = await ctx.db
            .query("subscriptions")
            .withIndex("by_active", (q) => q.eq("isActive", true))
            .collect();

        const latestSnapshot = await ctx.db
            .query("yieldSnapshots")
            .order("desc")
            .first();

        const totalSaved = activeSubscriptions.reduce(
            (sum, sub) => sum + (sub.dailyAmount * sub.currentStreak),
            0
        );

        return {
            totalUsers: users.length,
            activeSubscriptions: activeSubscriptions.filter(s => !s.isPaused).length,
            pausedSubscriptions: activeSubscriptions.filter(s => s.isPaused).length,
            totalDailySavings: activeSubscriptions.reduce((sum, s) => sum + s.dailyAmount, 0),
            vault: latestSnapshot ? {
                totalPooled: latestSnapshot.totalPooled,
                totalValue: latestSnapshot.totalValue,
                apy: latestSnapshot.apy,
            } : null,
        };
    },
});
