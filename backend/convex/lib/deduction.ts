import { ethers } from "ethers";
import { blockchainService } from "./blockchain";
import { notificationService } from "./notification";

export class DeductionService {
    /**
     * Check if a subscription should receive an auto-increase
     */
    shouldApplyAutoIncrease(subscription: any, now: number) {
        const intervalDays = subscription.autoIncreaseIntervalDays || 30;
        const lastIncrease = subscription.lastAutoIncreaseAt;

        if (!lastIncrease) {
            const startDate = subscription.startDate;
            const daysSinceStart = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
            return daysSinceStart >= intervalDays;
        }

        const daysSinceLastIncrease = Math.floor((now - lastIncrease) / (1000 * 60 * 60 * 24));
        return daysSinceLastIncrease >= intervalDays;
    }

    /**
     * Calculate new amount for auto-increase
     */
    calculateNewAmount(subscription: any): number {
        const currentAmount = subscription.dailyAmount;
        const increaseAmount = subscription.autoIncreaseAmount;
        const maxAmount = subscription.autoIncreaseMaxAmount;

        let newAmount;

        if (subscription.autoIncreaseType === 'FIXED') {
            newAmount = currentAmount + (increaseAmount || 0);
        } else if (subscription.autoIncreaseType === 'PERCENTAGE') {
            newAmount = currentAmount * (1 + (increaseAmount || 0) / 100);
        } else {
            return currentAmount;
        }

        // Round to 2 decimal places
        newAmount = Math.round(newAmount * 100) / 100;

        // Apply max cap if set
        if (maxAmount && newAmount > maxAmount) {
            newAmount = maxAmount;
        }

        return newAmount;
    }

    /**
     * Smart Pause Check
     */
    async checkLowBalance(subscription: any): Promise<{ shouldPause: boolean; balance?: string; required?: string }> {
        try {
            const userBalance = await blockchainService.getUserUsdcBalance(subscription.walletAddress);
            const requiredAmount = ethers.parseUnits(subscription.dailyAmount.toString(), 6);

            // Add 10% buffer
            const requiredWithBuffer = requiredAmount + (requiredAmount / 10n);

            if (userBalance < requiredWithBuffer) {
                return {
                    shouldPause: true,
                    balance: ethers.formatUnits(userBalance, 6),
                    required: ethers.formatUnits(requiredAmount, 6)
                };
            }
            return { shouldPause: false };
        } catch (error) {
            console.error(`Failed to check balance for ${subscription.walletAddress}:`, error);
            return { shouldPause: false };
        }
    }
}

export const deductionService = new DeductionService();
