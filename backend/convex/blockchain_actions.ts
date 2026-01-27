import { action } from "./_generated/server";
import { v } from "convex/values";
import { blockchainService } from "./lib/blockchain";

export const executeDailyDeduction = action({
    args: { userAddress: v.string() },
    handler: async (ctx, args) => {
        return await blockchainService.executeDailyDeduction(args.userAddress);
    },
});

export const batchExecuteDeductions = action({
    args: { userAddresses: v.array(v.string()) },
    handler: async (ctx, args) => {
        return await blockchainService.batchExecuteDeductions(args.userAddresses);
    },
});

export const getSubscription = action({
    args: { userAddress: v.string() },
    handler: async (ctx, args) => {
        return await blockchainService.getSubscription(args.userAddress);
    },
});

export const getAvantisVaultStats = action({
    args: {},
    handler: async (ctx) => {
        return await blockchainService.getAvantisVaultStats();
    },
});

export const getRelayerBalance = action({
    args: {},
    handler: async (ctx) => {
        return await blockchainService.getRelayerBalance();
    },
});

export const getUserUsdcBalance = action({
    args: { userAddress: v.string() },
    handler: async (ctx, args) => {
        const balance = await blockchainService.getUserUsdcBalance(args.userAddress);
        return balance.toString(); // Return as string for JSON compatibility
    },
});

export const estimateDeductionGas = action({
    args: { userAddresses: v.array(v.string()) },
    handler: async (ctx, args) => {
        return await blockchainService.estimateDeductionGas(args.userAddresses);
    },
});
