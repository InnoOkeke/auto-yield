import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { TransactionType, TransactionStatus } from "./transactions";

// ============ MUTATIONS ============

// Record a manual deposit
export const recordDeposit = mutation({
    args: {
        userId: v.id("users"),
        amount: v.number(),
        txHash: v.string(),
    },
    handler: async (ctx, args) => {
        // Check if transaction already exists
        const existing = await ctx.db
            .query("transactions")
            .withIndex("by_tx_hash", (q) => q.eq("txHash", args.txHash))
            .unique();

        if (existing) {
            return existing._id;
        }

        // Insert new manual deposit transaction
        return await ctx.db.insert("transactions", {
            userId: args.userId,
            type: TransactionType.MANUAL_DEPOSIT,
            amount: args.amount,
            txHash: args.txHash,
            blockNumber: 0,
            status: TransactionStatus.CONFIRMED,
        });
    },
});

// ============ QUERIES ============

// Get total manual savings for a user
export const getTotalManualSavings = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const transactions = await ctx.db
            .query("transactions")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();

        return transactions
            .filter(tx => tx.type === TransactionType.MANUAL_DEPOSIT || tx.type === TransactionType.CHALLENGE_DEPOSIT)
            .reduce((sum, tx) => sum + tx.amount, 0);
    },
});
