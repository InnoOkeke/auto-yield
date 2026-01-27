import { blockchainService } from './blockchain';
import { ethers } from 'ethers';

export interface SubscriptionInfo {
    startDate: number;
}

export interface TransactionInfo {
    type: string;
    status: string;
    amount: number;
}

export class AvantisService {
    cachedAPY: number | null = null;
    lastAPYFetch: number = 0;

    async getVaultStats() {
        try {
            const stats = await blockchainService.getAvantisVaultStats();

            if (!stats) return null;

            let apy = this.cachedAPY;
            const now = Date.now();

            if (!apy || (now - this.lastAPYFetch) > 3600000) {
                try {
                    const response = await fetch('https://yields.llama.fi/pools');
                    if (response.ok) {
                        const json = await response.json();
                        const pool = json.data.find((p: any) =>
                            p.project.toLowerCase().includes('avantis') &&
                            p.symbol === 'USDC' &&
                            p.chain === 'Base'
                        );
                        if (pool) {
                            apy = pool.apy;
                            this.cachedAPY = apy;
                            this.lastAPYFetch = now;
                        }
                    }
                } catch (e) {
                    console.error('Failed to fetch live APY:', e);
                }
            }

            if (!apy) apy = 9.45;

            return {
                totalAssets: ethers.formatUnits(stats.totalAssets, 6),
                totalSupply: stats.totalSupply,
                sharePrice: stats.sharePrice,
                apy: apy,
            };
        } catch (error) {
            console.error('Failed to get AvantisFi vault stats:', error);
            return null;
        }
    }

    async getUserYieldData(walletAddress: string, subscription: SubscriptionInfo, user: any, transactions: TransactionInfo[]) {
        try {
            const [shares, totalValue] = await Promise.all([
                blockchainService.getUserLPShares(walletAddress),
                blockchainService.getUserTotalValue(walletAddress),
            ]);

            if (!subscription) return null;

            // Filter confirmed deductions
            const confirmedDeductions = transactions.filter(
                (t) => t.type === 'DEDUCTION' && t.status === 'CONFIRMED'
            );

            // Calculate total deposited
            const totalDeposited = confirmedDeductions.reduce(
                (sum, tx) => sum + tx.amount,
                0
            );

            // Calculate yield earned
            const currentValue = parseFloat(ethers.formatUnits(totalValue, 6));
            const yieldEarned = currentValue - totalDeposited;

            // Calculate days active
            const daysActive = Math.floor(
                (Date.now() - subscription.startDate) / (1000 * 60 * 60 * 24)
            );

            return {
                walletAddress,
                lpShares: ethers.formatUnits(shares, 6),
                totalDeposited: totalDeposited.toFixed(2),
                currentValue: currentValue.toFixed(2),
                yieldEarned: yieldEarned.toFixed(2),
                yieldPercentage: totalDeposited > 0
                    ? ((yieldEarned / totalDeposited) * 100).toFixed(2)
                    : '0.00',
                daysActive,
                transactionCount: confirmedDeductions.length,
            };
        } catch (error) {
            console.error(`Failed to get yield data for ${walletAddress}:`, error);
            return null;
        }
    }

    async monitorVaultHealth() {
        try {
            const stats = await this.getVaultStats();
            if (!stats) {
                return { healthy: false, reason: 'Unable to fetch stats' };
            }

            const totalAssets = parseFloat(stats.totalAssets);
            return {
                healthy: true,
                totalAssets,
                apy: stats.apy,
            };
        } catch (error: any) {
            return { healthy: false, reason: error.message };
        }
    }
}

export const avantisService = new AvantisService();
