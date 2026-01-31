import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Transaction types
export const TransactionType = {
    DEDUCTION: "DEDUCTION",
    DEPOSIT_AVANTIS: "DEPOSIT_AVANTIS",
    WITHDRAWAL: "WITHDRAWAL",
    REWARDS_CLAIM: "REWARDS_CLAIM",
    EMERGENCY_WITHDRAWAL: "EMERGENCY_WITHDRAWAL",
    MANUAL_DEPOSIT: "MANUAL_DEPOSIT",
    CHALLENGE_DEPOSIT: "CHALLENGE_DEPOSIT",
    MANUAL_WITHDRAWAL: "MANUAL_WITHDRAWAL",
    CHALLENGE_WITHDRAWAL: "CHALLENGE_WITHDRAWAL",
} as const;

export const TransactionStatus = {
    PENDING: "PENDING",
    CONFIRMED: "CONFIRMED",
    FAILED: "FAILED",
    REVERTED: "REVERTED",
} as const;

// ============ QUERIES ============

// Get transactions by user
export const getByUser = query({
    args: {
        userId: v.id("users"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        let query = ctx.db
            .query("transactions")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .order("desc");

        if (args.limit) {
            return await query.take(args.limit);
        }
        return await query.collect();
    },
});

// Get transaction by hash
export const getByTxHash = query({
    args: { txHash: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("transactions")
            .withIndex("by_tx_hash", (q) => q.eq("txHash", args.txHash))
            .unique();
    },
});

// Get recent transactions
export const getRecent = query({
    args: { limit: v.number() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("transactions")
            .order("desc")
            .take(args.limit);
    },
});

// Get transactions by type
export const getByType = query({
    args: {
        type: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        let query = ctx.db
            .query("transactions")
            .withIndex("by_type", (q) => q.eq("type", args.type))
            .order("desc");

        if (args.limit) {
            return await query.take(args.limit);
        }
        return await query.collect();
    },
});

// ============ MUTATIONS ============

// Create transaction
export const create = mutation({
    args: {
        userId: v.id("users"),
        type: v.string(),
        amount: v.number(),
        txHash: v.string(),
        blockNumber: v.number(),
        status: v.optional(v.string()),
        avantisShares: v.optional(v.number()),
        errorMessage: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Check if transaction already exists
        const existing = await ctx.db
            .query("transactions")
            .withIndex("by_tx_hash", (q) => q.eq("txHash", args.txHash))
            .unique();

        if (existing) {
            throw new Error("Transaction already exists");
        }

        return await ctx.db.insert("transactions", {
            userId: args.userId,
            type: args.type,
            amount: args.amount,
            txHash: args.txHash,
            blockNumber: args.blockNumber,
            status: args.status || TransactionStatus.PENDING,
            avantisShares: args.avantisShares,
            errorMessage: args.errorMessage,
        });
    },
});

// Update transaction status
export const updateStatus = mutation({
    args: {
        txHash: v.string(),
        status: v.string(),
        errorMessage: v.optional(v.string()),
        avantisShares: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const tx = await ctx.db
            .query("transactions")
            .withIndex("by_tx_hash", (q) => q.eq("txHash", args.txHash))
            .unique();

        if (!tx) throw new Error("Transaction not found");

        const updates: any = { status: args.status };
        if (args.errorMessage) updates.errorMessage = args.errorMessage;
        if (args.avantisShares) updates.avantisShares = args.avantisShares;

        await ctx.db.patch(tx._id, updates);
        return tx._id;
    },
});
