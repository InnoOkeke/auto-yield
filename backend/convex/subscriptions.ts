import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============ QUERIES ============

// Get subscription by wallet address
export const getByWallet = query({
    args: { walletAddress: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("subscriptions")
            .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
            .unique();
    },
});

// Get subscription by user ID
export const getByUserId = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("subscriptions")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .unique();
    },
});

// Get all active subscriptions (not paused)
export const getActiveSubscriptions = query({
    handler: async (ctx) => {
        const subscriptions = await ctx.db
            .query("subscriptions")
            .withIndex("by_active", (q) => q.eq("isActive", true))
            .collect();

        // Filter out paused ones
        return subscriptions.filter(sub => !sub.isPaused);
    },
});

// Get subscriptions with auto-increase enabled
export const getAutoIncreaseEnabled = query({
    handler: async (ctx) => {
        const subscriptions = await ctx.db
            .query("subscriptions")
            .withIndex("by_active", (q) => q.eq("isActive", true))
            .collect();

        return subscriptions.filter(sub =>
            sub.autoIncreaseEnabled &&
            !sub.isPaused &&
            sub.autoIncreaseType &&
            sub.autoIncreaseAmount
        );
    },
});

// ============ MUTATIONS ============

// Create subscription
export const create = mutation({
    args: {
        userId: v.id("users"),
        walletAddress: v.string(),
        dailyAmount: v.number(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        return await ctx.db.insert("subscriptions", {
            userId: args.userId,
            walletAddress: args.walletAddress,
            dailyAmount: args.dailyAmount,
            isActive: true,
            startDate: now,
            currentStreak: 0,
            bestStreak: 0,
            isPaused: false,
            autoResumeEnabled: true,
            autoIncreaseEnabled: false,
        });
    },
});

// Update daily amount
export const updateDailyAmount = mutation({
    args: {
        walletAddress: v.string(),
        dailyAmount: v.number(),
    },
    handler: async (ctx, args) => {
        const sub = await ctx.db
            .query("subscriptions")
            .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
            .unique();

        if (!sub) throw new Error("Subscription not found");

        await ctx.db.patch(sub._id, { dailyAmount: args.dailyAmount });
        return sub._id;
    },
});

// Record deduction (update streak and last deduction)
export const recordDeduction = mutation({
    args: {
        subscriptionId: v.id("subscriptions"),
        nextDeduction: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const sub = await ctx.db.get(args.subscriptionId);
        if (!sub) throw new Error("Subscription not found");

        const now = Date.now();
        const newStreak = sub.currentStreak + 1;
        const newBestStreak = Math.max(newStreak, sub.bestStreak);

        await ctx.db.patch(args.subscriptionId, {
            lastDeduction: now,
            nextDeduction: args.nextDeduction,
            currentStreak: newStreak,
            bestStreak: newBestStreak,
        });
    },
});

// Pause subscription
export const pause = mutation({
    args: {
        walletAddress: v.string(),
        reason: v.string(),
    },
    handler: async (ctx, args) => {
        const sub = await ctx.db
            .query("subscriptions")
            .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
            .unique();

        if (!sub) throw new Error("Subscription not found");

        await ctx.db.patch(sub._id, {
            isPaused: true,
            pauseReason: args.reason,
            pausedAt: Date.now(),
        });

        return sub._id;
    },
});

// Resume subscription
export const resume = mutation({
    args: { walletAddress: v.string() },
    handler: async (ctx, args) => {
        const sub = await ctx.db
            .query("subscriptions")
            .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
            .unique();

        if (!sub) throw new Error("Subscription not found");

        await ctx.db.patch(sub._id, {
            isPaused: false,
            pauseReason: undefined,
            pausedAt: undefined,
        });

        return sub._id;
    },
});

// Update auto-increase settings
export const updateAutoIncrease = mutation({
    args: {
        walletAddress: v.string(),
        autoIncreaseEnabled: v.boolean(),
        autoIncreaseType: v.optional(v.string()),
        autoIncreaseAmount: v.optional(v.number()),
        autoIncreaseIntervalDays: v.optional(v.number()),
        autoIncreaseMaxAmount: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const sub = await ctx.db
            .query("subscriptions")
            .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
            .unique();

        if (!sub) throw new Error("Subscription not found");

        const { walletAddress, ...updates } = args;
        await ctx.db.patch(sub._id, updates);

        return sub._id;
    },
});

// Apply auto-increase (called by cron)
export const applyAutoIncrease = mutation({
    args: {
        subscriptionId: v.id("subscriptions"),
        newDailyAmount: v.number(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.subscriptionId, {
            dailyAmount: args.newDailyAmount,
            lastAutoIncreaseAt: Date.now(),
        });
    },
});

// Reset streak on missed day
export const resetStreak = mutation({
    args: { subscriptionId: v.id("subscriptions") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.subscriptionId, { currentStreak: 0 });
    },
});
