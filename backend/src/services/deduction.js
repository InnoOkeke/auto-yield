/**
 * Deduction Service - Migrated to Convex
 * Handles daily deductions, smart pause, auto-resume, and auto-increase
 */

import convex, { api } from '../utils/database.js';
import blockchainService from './blockchain.js';
import notificationService from './notification.js';
import { ethers } from 'ethers';

export class DeductionService {
    /**
     * Process daily deductions for all eligible users
     */
    async processDailyDeductions() {
        console.log('🔄 Starting daily deduction process...');

        try {
            // Step 1: Apply auto-increases for eligible subscriptions
            await this.applyAutoIncreases();

            // Step 2: Get all active subscriptions that are NOT paused
            const activeSubscriptions = await convex.query(api.subscriptions.getActiveSubscriptions);

            console.log(`Found ${activeSubscriptions.length} active subscriptions`);

            // Get user info for each subscription
            const subsWithUsers = await Promise.all(
                activeSubscriptions.map(async (sub) => {
                    const user = await convex.query(api.users.getById, { userId: sub.userId });
                    return { ...sub, user };
                })
            );

            // Filter users who can be deducted today
            const eligibleUsers = [];

            for (const sub of subsWithUsers) {
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
                    paused: 0,
                };
            }

            // Pre-check balances and smart pause users with low balance
            const usersToProcess = [];
            let pausedCount = 0;

            for (const sub of eligibleUsers) {
                const shouldPause = await this.checkAndSmartPause(sub);
                if (shouldPause) {
                    pausedCount++;
                } else {
                    usersToProcess.push(sub);
                }
            }

            console.log(`⏸️ Smart Paused ${pausedCount} users due to low balance`);
            console.log(`💰 ${usersToProcess.length} users will be processed`);

            // Process in batches of 10 for gas efficiency
            const BATCH_SIZE = 10;
            let processed = 0;
            let failed = 0;

            for (let i = 0; i < usersToProcess.length; i += BATCH_SIZE) {
                const batch = usersToProcess.slice(i, i + BATCH_SIZE);
                const addresses = batch.map(s => s.walletAddress);

                console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(usersToProcess.length / BATCH_SIZE)}`);

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
                if (i + BATCH_SIZE < usersToProcess.length) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }

            console.log(`✅ Deduction process complete: ${processed} processed, ${failed} failed, ${pausedCount} paused`);

            return {
                success: true,
                processed,
                failed,
                paused: pausedCount,
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
            await convex.mutation(api.transactions.create, {
                userId: subscription.userId,
                type: 'DEDUCTION',
                amount: parseFloat(subscription.dailyAmount.toString()),
                txHash: txResult.txHash,
                blockNumber: txResult.blockNumber,
                status: 'CONFIRMED',
            });

            // Update subscription streaks
            await convex.mutation(api.subscriptions.recordDeduction, {
                subscriptionId: subscription._id,
                nextDeduction: Date.now() + 24 * 60 * 60 * 1000, // +24 hours
            });

            const newStreak = (subscription.currentStreak || 0) + 1;
            console.log(`✅ Recorded deduction for ${subscription.walletAddress} (Streak: ${newStreak})`);

            // Send notification to user
            if (subscription.user?.notificationsEnabled) {
                await notificationService.sendDeductionNotification(
                    subscription.user,
                    subscription.dailyAmount.toString(),
                    newStreak
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
            await convex.mutation(api.transactions.create, {
                userId: subscription.userId,
                type: 'DEDUCTION',
                amount: parseFloat(subscription.dailyAmount.toString()),
                txHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
                blockNumber: 0,
                status: 'FAILED',
            });

            // Update transaction with error
            await convex.mutation(api.transactions.updateStatus, {
                txHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
                status: 'FAILED',
                errorMessage,
            });

            // Reset streak on failure
            await convex.mutation(api.subscriptions.resetStreak, {
                subscriptionId: subscription._id,
            });

            console.log(`⚠️ Recorded failed deduction for ${subscription.walletAddress} (Streak reset)`);
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

            await convex.mutation(api.stats.updateRelayerStatus, {
                address: blockchainService.wallet.address,
                ethBalance: balanceFloat,
                isHealthy: balanceFloat >= minBalance,
                alertSent: balanceFloat < minBalance,
            });

            if (balanceFloat < minBalance) {
                console.warn(`⚠️ LOW RELAYER BALANCE: ${balance} ETH (minimum: ${minBalance} ETH)`);
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
            // Get recent transactions
            const transactions = await convex.query(api.transactions.getByType, {
                type: 'DEDUCTION',
                limit: 1000,
            });

            // Filter by timeframe
            const since = Date.now();
            let cutoff;
            if (timeframe === '24h') {
                cutoff = since - 24 * 60 * 60 * 1000;
            } else if (timeframe === '7d') {
                cutoff = since - 7 * 24 * 60 * 60 * 1000;
            } else if (timeframe === '30d') {
                cutoff = since - 30 * 24 * 60 * 60 * 1000;
            }

            const filtered = transactions.filter(t => t._creationTime >= cutoff);

            const successful = filtered.filter(t => t.status === 'CONFIRMED').length;
            const failed = filtered.filter(t => t.status === 'FAILED').length;
            const totalAmount = filtered
                .filter(t => t.status === 'CONFIRMED')
                .reduce((sum, t) => sum + t.amount, 0);

            return {
                timeframe,
                successful,
                failed,
                total: filtered.length,
                totalAmount,
                successRate: filtered.length > 0 ? (successful / filtered.length) * 100 : 0,
            };
        } catch (error) {
            console.error('Failed to get deduction stats:', error);
            return null;
        }
    }

    /**
     * Smart Pause: Check user balance and pause if too low
     */
    async checkAndSmartPause(subscription) {
        try {
            const userBalance = await blockchainService.getUserUsdcBalance(subscription.walletAddress);
            const requiredAmount = ethers.parseUnits(subscription.dailyAmount.toString(), 6);

            // Add 10% buffer to avoid edge cases
            const requiredWithBuffer = requiredAmount + (requiredAmount / 10n);

            if (userBalance < requiredWithBuffer) {
                await this.triggerSmartPause(subscription, userBalance, requiredAmount);
                return true;
            }

            return false;
        } catch (error) {
            console.error(`Failed to check balance for ${subscription.walletAddress}:`, error);
            return false;
        }
    }

    /**
     * Trigger Smart Pause for a subscription
     */
    async triggerSmartPause(subscription, currentBalance, requiredAmount) {
        try {
            await convex.mutation(api.subscriptions.pause, {
                walletAddress: subscription.walletAddress,
                reason: 'LOW_BALANCE',
            });

            const formattedBalance = ethers.formatUnits(currentBalance, 6);
            const formattedRequired = ethers.formatUnits(requiredAmount, 6);

            console.log(`⏸️ Smart Paused: ${subscription.walletAddress} (Balance: $${formattedBalance}, Required: $${formattedRequired})`);

            if (subscription.user?.notificationsEnabled) {
                await notificationService.sendSmartPauseNotification(
                    subscription.user,
                    formattedBalance,
                    formattedRequired
                );
            }
        } catch (error) {
            console.error(`Failed to trigger Smart Pause for ${subscription.walletAddress}:`, error);
        }
    }

    /**
     * Check paused subscriptions and auto-resume when funded
     */
    async checkAndResumeSubscriptions() {
        console.log('🔄 Checking paused subscriptions for auto-resume...');

        try {
            // Get all subscriptions and filter paused ones
            const allSubs = await convex.query(api.subscriptions.getActiveSubscriptions);

            // We need to query differently - get by active status first
            // For now, let's get all and filter
            const pausedSubs = allSubs.filter(s =>
                s.isPaused &&
                s.pauseReason === 'LOW_BALANCE' &&
                s.autoResumeEnabled
            );

            console.log(`Found ${pausedSubs.length} paused subscriptions to check`);

            let resumed = 0;

            for (const sub of pausedSubs) {
                const user = await convex.query(api.users.getById, { userId: sub.userId });
                const balance = await blockchainService.getUserUsdcBalance(sub.walletAddress);
                const required = ethers.parseUnits(sub.dailyAmount.toString(), 6);

                // Require at least 3 days of savings to auto-resume
                const resumeThreshold = required * 3n;

                if (balance >= resumeThreshold) {
                    await convex.mutation(api.subscriptions.resume, {
                        walletAddress: sub.walletAddress,
                    });

                    const formattedBalance = ethers.formatUnits(balance, 6);
                    console.log(`▶️ Auto-resumed: ${sub.walletAddress} (Balance: $${formattedBalance})`);

                    if (user?.notificationsEnabled) {
                        await notificationService.sendAutoResumeNotification(user);
                    }

                    resumed++;
                }
            }

            console.log(`✅ Auto-resume check complete: ${resumed} subscriptions resumed`);

            return { success: true, resumed };
        } catch (error) {
            console.error('Failed to check/resume subscriptions:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Manually resume a paused subscription
     */
    async manualResume(walletAddress) {
        try {
            const sub = await convex.query(api.subscriptions.getByWallet, { walletAddress });

            if (!sub) {
                return { success: false, error: 'Subscription not found' };
            }

            if (!sub.isPaused) {
                return { success: false, error: 'Subscription is not paused' };
            }

            // Check if they have enough balance
            const balance = await blockchainService.getUserUsdcBalance(walletAddress);
            const required = ethers.parseUnits(sub.dailyAmount.toString(), 6);

            if (balance < required) {
                const formattedBalance = ethers.formatUnits(balance, 6);
                const formattedRequired = ethers.formatUnits(required, 6);
                return {
                    success: false,
                    error: `Insufficient balance. You have $${formattedBalance} but need at least $${formattedRequired}`
                };
            }

            await convex.mutation(api.subscriptions.resume, { walletAddress });

            const user = await convex.query(api.users.getById, { userId: sub.userId });
            console.log(`▶️ Manually resumed: ${walletAddress}`);

            if (user?.notificationsEnabled) {
                await notificationService.sendManualResumeNotification(user);
            }

            return { success: true };
        } catch (error) {
            console.error(`Failed to manually resume ${walletAddress}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Apply auto-increases for eligible subscriptions
     */
    async applyAutoIncreases() {
        console.log('📈 Checking for auto-increase eligibility...');

        try {
            const eligibleSubs = await convex.query(api.subscriptions.getAutoIncreaseEnabled);

            if (eligibleSubs.length === 0) {
                console.log('📈 No subscriptions with auto-increase enabled');
                return { increased: 0 };
            }

            console.log(`📈 Found ${eligibleSubs.length} subscriptions with auto-increase enabled`);

            let increasedCount = 0;
            const now = Date.now();

            for (const sub of eligibleSubs) {
                const user = await convex.query(api.users.getById, { userId: sub.userId });
                const shouldIncrease = this.shouldApplyAutoIncrease(sub, now);

                if (shouldIncrease) {
                    const result = await this.applyAutoIncrease({ ...sub, user });
                    if (result.success) {
                        increasedCount++;
                    }
                }
            }

            console.log(`📈 Auto-increase complete: ${increasedCount} subscriptions updated`);
            return { increased: increasedCount };
        } catch (error) {
            console.error('❌ Failed to apply auto-increases:', error);
            return { increased: 0, error: error.message };
        }
    }

    /**
     * Check if a subscription should receive an auto-increase
     */
    shouldApplyAutoIncrease(subscription, now) {
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
     * Apply auto-increase to a subscription
     */
    async applyAutoIncrease(subscription) {
        try {
            const currentAmount = subscription.dailyAmount;
            const increaseAmount = subscription.autoIncreaseAmount;
            const maxAmount = subscription.autoIncreaseMaxAmount;

            let newAmount;

            if (subscription.autoIncreaseType === 'FIXED') {
                newAmount = currentAmount + increaseAmount;
            } else if (subscription.autoIncreaseType === 'PERCENTAGE') {
                newAmount = currentAmount * (1 + increaseAmount / 100);
            } else {
                return { success: false, error: 'Invalid auto-increase type' };
            }

            // Round to 2 decimal places
            newAmount = Math.round(newAmount * 100) / 100;

            // Apply max cap if set
            if (maxAmount && newAmount > maxAmount) {
                console.log(`📈 ${subscription.walletAddress}: Capped at $${maxAmount} (would be $${newAmount})`);
                newAmount = maxAmount;
            }

            // Don't increase if already at max
            if (newAmount === currentAmount) {
                return { success: false, reason: 'Already at max amount' };
            }

            // Update subscription with new amount
            await convex.mutation(api.subscriptions.applyAutoIncrease, {
                subscriptionId: subscription._id,
                newDailyAmount: newAmount,
            });

            const increaseType = subscription.autoIncreaseType === 'FIXED'
                ? `+$${increaseAmount}`
                : `+${increaseAmount}%`;

            console.log(`📈 Auto-increased: ${subscription.walletAddress} ($${currentAmount} → $${newAmount}) [${increaseType}]`);

            if (subscription.user?.notificationsEnabled) {
                await notificationService.sendAutoIncreaseNotification(
                    subscription.user,
                    currentAmount.toFixed(2),
                    newAmount.toFixed(2)
                );
            }

            return { success: true, oldAmount: currentAmount, newAmount };
        } catch (error) {
            console.error(`❌ Failed to apply auto-increase for ${subscription.walletAddress}:`, error);
            return { success: false, error: error.message };
        }
    }
}

export default new DeductionService();
