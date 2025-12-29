import prisma from '../utils/database.js';
import blockchainService from './blockchain.js';
import { ethers } from 'ethers';

export class AvantisService {
    /**
     * Get AvantisFi vault statistics
     */
    async getVaultStats() {
        try {
            const stats = await blockchainService.getAvantisVaultStats();

            if (!stats) return null;

            // Calculate APY (simplified - in production, fetch historical data)
            // For now, use a placeholder
            const estimatedAPY = 12.5; // 12.5% APY placeholder

            return {
                totalAssets: ethers.formatUnits(stats.totalAssets, 6), // USDC has 6 decimals
                totalSupply: stats.totalSupply,
                sharePrice: stats.sharePrice,
                apy: estimatedAPY,
            };
        } catch (error) {
            console.error('Failed to get AvantisFi vault stats:', error);
            return null;
        }
    }

    /**
     * Get user-specific yield data
     */
    async getUserYieldData(walletAddress) {
        try {
            const [shares, totalValue] = await Promise.all([
                blockchainService.getUserLPShares(walletAddress),
                blockchainService.getUserTotalValue(walletAddress),
            ]);

            const subscription = await prisma.subscription.findUnique({
                where: { walletAddress },
                include: {
                    user: {
                        include: {
                            transactions: {
                                where: {
                                    type: 'DEDUCTION',
                                    status: 'CONFIRMED',
                                },
                            },
                        },
                    },
                },
            });

            if (!subscription) {
                return null;
            }

            // Calculate total deposited
            const totalDeposited = subscription.user.transactions.reduce(
                (sum, tx) => sum + parseFloat(tx.amount.toString()),
                0
            );

            // Calculate yield earned
            const currentValue = parseFloat(ethers.formatUnits(totalValue, 6));
            const yieldEarned = currentValue - totalDeposited;

            // Calculate days active
            const daysActive = Math.floor(
                (Date.now() - subscription.startDate.getTime()) / (1000 * 60 * 60 * 24)
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
                transactionCount: subscription.user.transactions.length,
            };
        } catch (error) {
            console.error(`Failed to get yield data for ${walletAddress}:`, error);
            return null;
        }
    }

    /**
     * Create yield snapshot for analytics
     */
    async createYieldSnapshot() {
        try {
            const vaultStats = await this.getVaultStats();

            if (!vaultStats) {
                console.error('Failed to fetch vault stats for snapshot');
                return null;
            }

            // Get total pooled from all active subscriptions
            const subscriptions = await prisma.subscription.findMany({
                where: { isActive: true },
                include: {
                    user: {
                        include: {
                            transactions: {
                                where: {
                                    type: 'DEDUCTION',
                                    status: 'CONFIRMED',
                                },
                            },
                        },
                    },
                },
            });

            const totalPooled = subscriptions.reduce((sum, sub) => {
                const userDeposits = sub.user.transactions.reduce(
                    (txSum, tx) => txSum + parseFloat(tx.amount.toString()),
                    0
                );
                return sum + userDeposits;
            }, 0);

            const snapshot = await prisma.yieldSnapshot.create({
                data: {
                    totalPooled: totalPooled.toString(),
                    avantisShares: vaultStats.totalSupply,
                    totalValue: vaultStats.totalAssets,
                    apy: vaultStats.apy.toString(),
                    timestamp: new Date(),
                },
            });

            console.log(`✅ Created yield snapshot: ${snapshot.id}`);

            return snapshot;
        } catch (error) {
            console.error('Failed to create yield snapshot:', error);
            return null;
        }
    }

    /**
     * Get historical yield data
     */
    async getHistoricalYield(timeframe = '30d') {
        try {
            const since = new Date();
            if (timeframe === '7d') {
                since.setDate(since.getDate() - 7);
            } else if (timeframe === '30d') {
                since.setDate(since.getDate() - 30);
            } else if (timeframe === '90d') {
                since.setDate(since.getDate() - 90);
            }

            const snapshots = await prisma.yieldSnapshot.findMany({
                where: {
                    timestamp: {
                        gte: since,
                    },
                },
                orderBy: {
                    timestamp: 'asc',
                },
            });

            return snapshots.map(s => ({
                timestamp: s.timestamp.toISOString(),
                totalValue: parseFloat(s.totalValue.toString()),
                apy: parseFloat(s.apy.toString()),
            }));
        } catch (error) {
            console.error('Failed to get historical yield:', error);
            return [];
        }
    }

    /**
     * Monitor AvantisFi vault health
     */
    async monitorVaultHealth() {
        try {
            const stats = await this.getVaultStats();

            if (!stats) {
                console.warn('⚠️ Unable to fetch AvantisFi vault stats');
                return { healthy: false, reason: 'Unable to fetch stats' };
            }

            const totalAssets = parseFloat(stats.totalAssets);

            // Check for anomalies
            const previousSnapshot = await prisma.yieldSnapshot.findFirst({
                orderBy: { timestamp: 'desc' },
            });

            if (previousSnapshot) {
                const previousValue = parseFloat(previousSnapshot.totalValue.toString());
                const change = ((totalAssets - previousValue) / previousValue) * 100;

                // Alert if >20% drop (potential exploit or issue)
                if (change < -20) {
                    console.error(`🚨 ALERT: AvantisFi vault value dropped by ${change.toFixed(2)}%`);
                    // TODO: Send emergency alert, pause deductions
                    return {
                        healthy: false,
                        reason: `Vault value dropped ${change.toFixed(2)}%`,
                        previousValue,
                        currentValue: totalAssets,
                    };
                }

                // Alert if APY is outside expected range (0-50%)
                if (stats.apy < 0 || stats.apy > 50) {
                    console.warn(`⚠️ Unusual APY detected: ${stats.apy}%`);
                }
            }

            return {
                healthy: true,
                totalAssets,
                apy: stats.apy,
            };
        } catch (error) {
            console.error('Failed to monitor vault health:', error);
            return { healthy: false, reason: error.message };
        }
    }
}

export default new AvantisService();
