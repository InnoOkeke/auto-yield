import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============ QUERIES ============

// Get user by wallet address
export const getByWallet = query({
    args: { walletAddress: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
            .unique();
    },
});

// Get user by Farcaster FID
export const getByFid = query({
    args: { farcasterFid: v.number() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_fid", (q) => q.eq("farcasterFid", args.farcasterFid))
            .unique();
    },
});

// Get user by ID
export const getById = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.userId);
    },
});

/**
 * Get full user profile including subscription and recent transactions
 */
export const getUserProfile = query({
    args: { walletAddress: v.string() },
    handler: async (ctx, args): Promise<any> => {
        const address = args.walletAddress.toLowerCase();
        const user = await ctx.db.query("users").withIndex("by_wallet", q => q.eq("walletAddress", address)).first();

        if (!user) return null;

        const subscription = await ctx.db.query("subscriptions").withIndex("by_user", q => q.eq("userId", user._id)).first();
        const transactions = await ctx.db.query("transactions").withIndex("by_user", q => q.eq("userId", user._id)).order("desc").take(10);

        return {
            ...user,
            subscription,
            transactions,
        };
    }
});

// ============ MUTATIONS ============

// Create or update user (upsert)
export const upsert = mutation({
    args: {
        farcasterFid: v.number(),
        walletAddress: v.string(),
        username: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Check if user exists by wallet
        const existing = await ctx.db
            .query("users")
            .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
            .unique();

        if (existing) {
            // Update existing user
            await ctx.db.patch(existing._id, {
                farcasterFid: args.farcasterFid,
                username: args.username,
            });
            return existing._id;
        }

        // Create new user
        return await ctx.db.insert("users", {
            farcasterFid: args.farcasterFid,
            walletAddress: args.walletAddress,
            username: args.username,
            notificationsEnabled: false,
        });
    },
});

// Update notification settings
export const updateNotifications = mutation({
    args: {
        userId: v.id("users"),
        notificationsEnabled: v.boolean(),
        notificationUrl: v.optional(v.string()),
        notificationToken: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { userId, ...updates } = args;
        await ctx.db.patch(userId, updates);
    },
});

// Enable notifications
export const enableNotifications = mutation({
    args: {
        walletAddress: v.string(),
        notificationUrl: v.string(),
        notificationToken: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
            .unique();

        if (!user) throw new Error("User not found");

        await ctx.db.patch(user._id, {
            notificationsEnabled: true,
            notificationUrl: args.notificationUrl,
            notificationToken: args.notificationToken,
        });

        return user._id;
    },
});

// Disable notifications
export const disableNotifications = mutation({
    args: { walletAddress: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
            .unique();

        if (!user) throw new Error("User not found");

        await ctx.db.patch(user._id, {
            notificationsEnabled: false,
            notificationUrl: undefined,
            notificationToken: undefined,
        });

        return user._id;
    },
});
