import prisma from '../utils/database.js';
import blockchainService from './blockchain.js';
import notificationService from './notification.js';

export class DeductionService {
    /**
     * Process daily deductions for all eligible users
     */
    async processDailyDeductions() {
        console.log('🔄 Starting daily deduction process...');

        try {
            // Get all active subscriptions from database
            const activeSubscriptions = await prisma.subscription.findMany({
                where: {
                    isActive: true,
                },
                include: {
                    user: true,
                },
            });

            console.log(`Found ${activeSubscriptions.length} active subscriptions`);

            // Filter users who can be deducted today
            const eligibleUsers = [];

            for (const sub of activeSubscriptions) {
                const canDeduct = await blockchainService.canDeductToday(sub.walletAddress);
                if (canDeduct) {
                    eligibleUsers.push(sub);
                }
            }

            console.log(`${eligibleUsers.length} users eligible for deduction today`);

            if (eligibleUsers.length === 0) {
                console.log('✅ No deductions to process');
                return {
                    success: true,
                    processed: 0,
                    failed: 0,
                };
            }

            // Process in batches of 10 for gas efficiency
            const BATCH_SIZE = 10;
            let processed = 0;
            let failed = 0;

            for (let i = 0; i < eligibleUsers.length; i += BATCH_SIZE) {
                const batch = eligibleUsers.slice(i, i + BATCH_SIZE);
                const addresses = batch.map(s => s.walletAddress);

                console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(eligibleUsers.length / BATCH_SIZE)}`);

                const result = await blockchainService.batchExecuteDeductions(addresses);

                if (result.success) {
                    // Record transactions in database
                    for (const sub of batch) {
                        await this.recordDeduction(sub, result);
                    }
                    processed += batch.length;
                } else {
                    // Try individual deductions as fallback
                    for (const sub of batch) {
                        const individualResult = await blockchainService.executeDailyDeduction(sub.walletAddress);

                        if (individualResult.success) {
                            await this.recordDeduction(sub, individualResult);
                            processed++;
                        } else {
                            await this.recordFailedDeduction(sub, individualResult.error);
                            failed++;
                        }
                    }
                }

                // Small delay between batches to prevent RPC rate limiting
                if (i + BATCH_SIZE < eligibleUsers.length) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }

            console.log(`✅ Deduction process complete: ${processed} processed, ${failed} failed`);

            return {
                success: true,
                processed,
                failed,
                total: eligibleUsers.length,
            };
        } catch (error) {
            console.error('❌ Daily deduction process failed:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Record successful deduction in database
     */
    async recordDeduction(subscription, txResult) {
        try {
            // Create transaction record
            await prisma.transaction.create({
                data: {
                    userId: subscription.userId,
                    type: 'DEDUCTION',
                    amount: subscription.dailyAmount,
                    txHash: txResult.txHash,
                    blockNumber: txResult.blockNumber,
                    status: 'CONFIRMED',
                    timestamp: new Date(),
                },
            });

            // Update subscription last deduction time
            await prisma.subscription.update({
                where: { id: subscription.id },
                data: {
                    lastDeduction: new Date(),
                    nextDeduction: new Date(Date.now() + 24 * 60 * 60 * 1000), // +24 hours
                },
            });

            console.log(`✅ Recorded deduction for ${subscription.walletAddress}`);

            // Send notification to user
            if (subscription.user.notificationsEnabled) {
                await notificationService.sendDeductionNotification(
                    subscription.user,
                    subscription.dailyAmount.toString()
                );
            }
        } catch (error) {
            console.error(`Failed to record deduction for ${subscription.walletAddress}:`, error);
        }
    }

    /**
     * Record failed deduction attempt
     */
    async recordFailedDeduction(subscription, errorMessage) {
        try {
            await prisma.transaction.create({
                data: {
                    userId: subscription.userId,
                    type: 'DEDUCTION',
                    amount: subscription.dailyAmount,
                    txHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
                    blockNumber: 0,
                    status: 'FAILED',
                    errorMessage,
                    timestamp: new Date(),
                },
            });

            console.log(`⚠️ Recorded failed deduction for ${subscription.walletAddress}`);
        } catch (error) {
            console.error(`Failed to record failed deduction for ${subscription.walletAddress}:`, error);
        }
    }

    /**
     * Check relayer wallet balance and send alert if low
     */
    async checkRelayerBalance() {
        try {
            const balance = await blockchainService.getRelayerBalance();
            const balanceFloat = parseFloat(balance);
            const minBalance = parseFloat(process.env.MIN_RELAYER_BALANCE_ETH || '0.1');

            await prisma.relayerStatus.upsert({
                where: { address: blockchainService.wallet.address },
                update: {
                    ethBalance: balance,
                    lastCheck: new Date(),
                    isHealthy: balanceFloat >= minBalance,
                    alertSent: balanceFloat < minBalance,
                },
                create: {
                    address: blockchainService.wallet.address,
                    ethBalance: balance,
                    isHealthy: balanceFloat >= minBalance,
                    alertSent: balanceFloat < minBalance,
                },
            });

            if (balanceFloat < minBalance) {
                console.warn(`⚠️ LOW RELAYER BALANCE: ${balance} ETH (minimum: ${minBalance} ETH)`);
                // TODO: Send email/SMS alert
            }

            return balanceFloat;
        } catch (error) {
            console.error('Failed to check relayer balance:', error);
            return 0;
        }
    }

    /**
     * Get deduction statistics
     */
    async getDeductionStats(timeframe = '24h') {
        try {
            const since = new Date();
            if (timeframe === '24h') {
                since.setHours(since.getHours() - 24);
            } else if (timeframe === '7d') {
                since.setDate(since.getDate() - 7);
            } else if (timeframe === '30d') {
                since.setDate(since.getDate() - 30);
            }

            const transactions = await prisma.transaction.findMany({
                where: {
                    type: 'DEDUCTION',
                    timestamp: {
                        gte: since,
                    },
                },
            });

            const successful = transactions.filter(t => t.status === 'CONFIRMED').length;
            const failed = transactions.filter(t => t.status === 'FAILED').length;
            const totalAmount = transactions
                .filter(t => t.status === 'CONFIRMED')
                .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

            return {
                timeframe,
                successful,
                failed,
                total: transactions.length,
                totalAmount,
                successRate: transactions.length > 0 ? (successful / transactions.length) * 100 : 0,
            };
        } catch (error) {
            console.error('Failed to get deduction stats:', error);
            return null;
        }
    }
}

export default new DeductionService();
