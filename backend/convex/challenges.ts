import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { TransactionType } from "./transactions";

// ============ QUERIES ============

// Get challenge by ID
export const getById = query({
    args: { challengeId: v.id("challenges") },
    handler: async (ctx, args) => {
        const challenge = await ctx.db.get(args.challengeId);
        if (!challenge) return null;

        const participants = await ctx.db
            .query("challengeParticipants")
            .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
            .collect();

        return { ...challenge, participants };
    },
});

// List all active public challenges
export const listActive = query({
    handler: async (ctx) => {
        return await ctx.db
            .query("challenges")
            .withIndex("by_status", (q) => q.eq("status", "ACTIVE"))
            .filter((q) => q.eq(q.field("isPrivate"), false))
            .collect();
    },
});

// Get challenges for a user
export const getMyChallenges = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const participations = await ctx.db
            .query("challengeParticipants")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();

        const challenges = [];
        for (const p of participations) {
            const challenge = await ctx.db.get(p.challengeId);
            if (challenge) {
                challenges.push({ ...challenge, userContribution: p.contributedAmount });
            }
        }
        return challenges;
    },
});

// ============ MUTATIONS ============

// Create a new challenge
export const create = mutation({
    args: {
        creatorId: v.id("users"),
        name: v.string(),
        description: v.optional(v.string()),
        targetAmount: v.number(),
        currency: v.string(),
        endDate: v.optional(v.number()),
        isPrivate: v.boolean(),
        inviteCode: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const challengeId = await ctx.db.insert("challenges", {
            creatorId: args.creatorId,
            name: args.name,
            description: args.description,
            targetAmount: args.targetAmount,
            currentAmount: 0,
            currency: args.currency,
            startDate: Date.now(),
            endDate: args.endDate,
            status: "ACTIVE",
            isPrivate: args.isPrivate,
            inviteCode: args.inviteCode,
        });

        // Add creator as first participant
        await ctx.db.insert("challengeParticipants", {
            challengeId,
            userId: args.creatorId,
            joinedAt: Date.now(),
            contributedAmount: 0,
            status: "ACTIVE",
        });

        return challengeId;
    },
});

// Join a challenge
export const join = mutation({
    args: {
        challengeId: v.id("challenges"),
        userId: v.id("users"),
        inviteCode: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const challenge = await ctx.db.get(args.challengeId);
        if (!challenge) throw new Error("Challenge not found");
        if (challenge.status !== "ACTIVE") throw new Error("Challenge is not active");

        if (challenge.isPrivate && challenge.inviteCode !== args.inviteCode) {
            throw new Error("Invalid invite code");
        }

        // Check if already joined
        const existing = await ctx.db
            .query("challengeParticipants")
            .withIndex("by_challenge_user", (q) =>
                q.eq("challengeId", args.challengeId).eq("userId", args.userId)
            )
            .unique();

        if (existing) return existing._id;

        return await ctx.db.insert("challengeParticipants", {
            challengeId: args.challengeId,
            userId: args.userId,
            joinedAt: Date.now(),
            contributedAmount: 0,
            status: "ACTIVE",
        });
    },
});

// Record contribution to a challenge
export const contribute = mutation({
    args: {
        challengeId: v.id("challenges"),
        userId: v.id("users"),
        amount: v.number(),
        txHash: v.string(),
    },
    handler: async (ctx, args) => {
        const challenge = await ctx.db.get(args.challengeId);
        if (!challenge) throw new Error("Challenge not found");

        const participant = await ctx.db
            .query("challengeParticipants")
            .withIndex("by_challenge_user", (q) =>
                q.eq("challengeId", args.challengeId).eq("userId", args.userId)
            )
            .unique();

        if (!participant) throw new Error("User is not a participant of this challenge");

        // Update participant contribution
        await ctx.db.patch(participant._id, {
            contributedAmount: participant.contributedAmount + args.amount,
        });

        // Update challenge total
        const newTotal = challenge.currentAmount + args.amount;
        await ctx.db.patch(challenge._id, {
            currentAmount: newTotal,
            status: newTotal >= challenge.targetAmount ? "COMPLETED" : "ACTIVE",
        });

        // Record transaction
        await ctx.db.insert("transactions", {
            userId: args.userId,
            type: TransactionType.CHALLENGE_DEPOSIT,
            amount: args.amount,
            txHash: args.txHash,
            blockNumber: 0, // Will be updated by indexing or just left as is if not critical
            status: "CONFIRMED",
        });

        return challenge._id;
    },
});
