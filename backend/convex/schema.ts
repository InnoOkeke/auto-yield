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
        type: v.string(), // "DEDUCTION" | "DEPOSIT_AVANTIS" | "WITHDRAWAL" | "REWARDS_CLAIM" | "EMERGENCY_WITHDRAWAL" | "MANUAL_DEPOSIT" | "CHALLENGE_DEPOSIT"
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

    // Challenges model - Shared saving goals
    challenges: defineTable({
        creatorId: v.id("users"),
        name: v.string(),
        description: v.optional(v.string()),
        targetAmount: v.number(), // Total goal for the challenge
        currentAmount: v.number(), // Accumulated across all participants
        currency: v.string(), // e.g., "USDC"
        startDate: v.number(),
        endDate: v.optional(v.number()),
        status: v.string(), // "ACTIVE" | "COMPLETED" | "CANCELLED"
        isPrivate: v.boolean(),
        inviteCode: v.optional(v.string()),
    })
        .index("by_creator", ["creatorId"])
        .index("by_status", ["status"]),

    // ChallengeParticipants model - Junction table for users in challenges
    challengeParticipants: defineTable({
        challengeId: v.id("challenges"),
        userId: v.id("users"),
        joinedAt: v.number(),
        contributedAmount: v.number(),
        status: v.string(), // "ACTIVE" | "COMPLETED" | "LEFT"
    })
        .index("by_challenge", ["challengeId"])
        .index("by_user", ["userId"])
        .index("by_challenge_user", ["challengeId", "userId"]),

    // RelayerStatus model - Backend health monitoring
    relayerStatus: defineTable({
        address: v.string(),
        ethBalance: v.number(),
        isHealthy: v.boolean(),
        alertSent: v.boolean(),
    }).index("by_address", ["address"]),
});
