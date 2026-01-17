import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    // User model - Farcaster users with wallet and notification settings
    users: defineTable({
        farcasterFid: v.number(),
        walletAddress: v.string(),
        username: v.optional(v.string()),
        notificationUrl: v.optional(v.string()),
        notificationToken: v.optional(v.string()),
        notificationsEnabled: v.boolean(),
    })
        .index("by_wallet", ["walletAddress"])
        .index("by_fid", ["farcasterFid"]),

    // Subscription model - Daily savings settings, streaks, pause, auto-increase
    subscriptions: defineTable({
        userId: v.id("users"),
        walletAddress: v.string(),
        dailyAmount: v.number(), // Stored as float (USDC amount)
        isActive: v.boolean(),
        startDate: v.number(), // Timestamp
        lastDeduction: v.optional(v.number()),
        nextDeduction: v.optional(v.number()),
        currentStreak: v.number(),
        bestStreak: v.number(),
        // Smart Pause fields
        isPaused: v.boolean(),
        pauseReason: v.optional(v.string()), // "LOW_BALANCE" | "MANUAL" | null
        pausedAt: v.optional(v.number()),
        autoResumeEnabled: v.boolean(),
        pauseNotifiedAt: v.optional(v.number()),
        // Auto-Increase Rule fields
        autoIncreaseEnabled: v.boolean(),
        autoIncreaseType: v.optional(v.string()), // "FIXED" | "PERCENTAGE"
        autoIncreaseAmount: v.optional(v.number()),
        autoIncreaseIntervalDays: v.optional(v.number()),
        autoIncreaseMaxAmount: v.optional(v.number()),
        lastAutoIncreaseAt: v.optional(v.number()),
    })
        .index("by_wallet", ["walletAddress"])
        .index("by_user", ["userId"])
        .index("by_active", ["isActive"])
        .index("by_next_deduction", ["nextDeduction"]),

    // Transaction model - Deduction/deposit/withdrawal history
    transactions: defineTable({
        userId: v.id("users"),
        type: v.string(), // "DEDUCTION" | "DEPOSIT_AVANTIS" | "WITHDRAWAL" | "REWARDS_CLAIM" | "EMERGENCY_WITHDRAWAL"
        amount: v.number(),
        txHash: v.string(),
        blockNumber: v.number(),
        status: v.string(), // "PENDING" | "CONFIRMED" | "FAILED" | "REVERTED"
        avantisShares: v.optional(v.number()),
        errorMessage: v.optional(v.string()),
    })
        .index("by_tx_hash", ["txHash"])
        .index("by_user", ["userId"])
        .index("by_type", ["type"]),

    // YieldSnapshot model - APY and yield tracking snapshots
    yieldSnapshots: defineTable({
        totalPooled: v.number(),
        avantisShares: v.number(),
        totalValue: v.number(),
        apy: v.number(),
    }),

    // RelayerStatus model - Backend health monitoring
    relayerStatus: defineTable({
        address: v.string(),
        ethBalance: v.number(),
        isHealthy: v.boolean(),
        alertSent: v.boolean(),
    }).index("by_address", ["address"]),
});
