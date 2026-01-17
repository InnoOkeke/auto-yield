/**
 * Convex client for server-side usage
 * This connects the Express backend to Convex
 */

import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api.js';

// Initialize Convex client
const convexUrl = process.env.CONVEX_URL || 'http://127.0.0.1:3210';
export const convex = new ConvexHttpClient(convexUrl);

// Re-export the API for convenience
export { api };

// ============ USER HELPERS ============

export async function getOrCreateUser(farcasterFid, walletAddress, username) {
    const userId = await convex.mutation(api.users.upsert, {
        farcasterFid,
        walletAddress,
        username,
    });
    return await convex.query(api.users.getById, { userId });
}

export async function getUserByWallet(walletAddress) {
    return await convex.query(api.users.getByWallet, { walletAddress });
}

export async function getUserByFid(farcasterFid) {
    return await convex.query(api.users.getByFid, { farcasterFid });
}

// ============ SUBSCRIPTION HELPERS ============

export async function getSubscription(walletAddress) {
    return await convex.query(api.subscriptions.getByWallet, { walletAddress });
}

export async function getActiveSubscriptions() {
    return await convex.query(api.subscriptions.getActiveSubscriptions);
}

export async function getAutoIncreaseSubscriptions() {
    return await convex.query(api.subscriptions.getAutoIncreaseEnabled);
}

export async function createSubscription(userId, walletAddress, dailyAmount) {
    return await convex.mutation(api.subscriptions.create, {
        userId,
        walletAddress,
        dailyAmount,
    });
}

export async function updateDailyAmount(walletAddress, dailyAmount) {
    return await convex.mutation(api.subscriptions.updateDailyAmount, {
        walletAddress,
        dailyAmount,
    });
}

export async function pauseSubscription(walletAddress, reason) {
    return await convex.mutation(api.subscriptions.pause, {
        walletAddress,
        reason,
    });
}

export async function resumeSubscription(walletAddress) {
    return await convex.mutation(api.subscriptions.resume, { walletAddress });
}

export async function updateAutoIncrease(walletAddress, settings) {
    return await convex.mutation(api.subscriptions.updateAutoIncrease, {
        walletAddress,
        ...settings,
    });
}

// ============ TRANSACTION HELPERS ============

export async function createTransaction(userId, type, amount, txHash, blockNumber) {
    return await convex.mutation(api.transactions.create, {
        userId,
        type,
        amount,
        txHash,
        blockNumber,
    });
}

export async function updateTransactionStatus(txHash, status, errorMessage) {
    return await convex.mutation(api.transactions.updateStatus, {
        txHash,
        status,
        errorMessage,
    });
}

export async function getTransactionsByUser(userId, limit = 50) {
    return await convex.query(api.transactions.getByUser, { userId, limit });
}

// ============ STATS HELPERS ============

export async function getStats() {
    return await convex.query(api.stats.getStats);
}

export async function createYieldSnapshot(totalPooled, avantisShares, totalValue, apy) {
    return await convex.mutation(api.stats.createSnapshot, {
        totalPooled,
        avantisShares,
        totalValue,
        apy,
    });
}

export async function updateRelayerStatus(address, ethBalance, isHealthy, alertSent) {
    return await convex.mutation(api.stats.updateRelayerStatus, {
        address,
        ethBalance,
        isHealthy,
        alertSent,
    });
}

// ============ NOTIFICATION HELPERS ============

export async function enableNotifications(walletAddress, notificationUrl, notificationToken) {
    return await convex.mutation(api.users.enableNotifications, {
        walletAddress,
        notificationUrl,
        notificationToken,
    });
}

export async function disableNotifications(walletAddress) {
    return await convex.mutation(api.users.disableNotifications, { walletAddress });
}

console.log('✅ Convex client initialized:', convexUrl);

export default convex;
