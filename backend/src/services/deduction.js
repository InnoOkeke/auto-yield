import prisma from '../utils/database.js';
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
            const activeSubscriptions = await prisma.subscription.findMany({
                where: {
                    isActive: true,
                    isPaused: false, // Skip Smart Paused subscriptions
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

            // Calculate new streaks
            const newCurrentStreak = (subscription.currentStreak || 0) + 1;
            const newBestStreak = Math.max(subscription.bestStreak || 0, newCurrentStreak);

            // Update subscription last deduction time and streaks
            await prisma.subscription.update({
                where: { id: subscription.id },
                data: {
                    lastDeduction: new Date(),
                    nextDeduction: new Date(Date.now() + 24 * 60 * 60 * 1000), // +24 hours
                    currentStreak: newCurrentStreak,
                    bestStreak: newBestStreak,
                },
            });

            console.log(`✅ Recorded deduction for ${subscription.walletAddress} (Streak: ${newCurrentStreak})`);

            // Send notification to user
            if (subscription.user.notificationsEnabled) {
                await notificationService.sendDeductionNotification(
                    subscription.user,
                    subscription.dailyAmount.toString(),
                    newCurrentStreak // Pass streak to notification
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

            // Reset streak on failure
            await prisma.subscription.update({
                where: { id: subscription.id },
                data: {
                    currentStreak: 0,
                },
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

    /**
     * Smart Pause: Check user balance and pause if too low
     * Returns true if user was paused, false if they should proceed
     */
    async checkAndSmartPause(subscription) {
        try {
            const userBalance = await blockchainService.getUserUsdcBalance(subscription.walletAddress);
            const requiredAmount = ethers.parseUnits(subscription.dailyAmount.toString(), 6);

            // Add 10% buffer to avoid edge cases
            const requiredWithBuffer = requiredAmount + (requiredAmount / 10n);

            if (userBalance < requiredWithBuffer) {
                // Trigger Smart Pause
                await this.triggerSmartPause(subscription, userBalance, requiredAmount);
                return true;
            }

            return false;
        } catch (error) {
            console.error(`Failed to check balance for ${subscription.walletAddress}:`, error);
            // If we can't check balance, proceed with deduction attempt
            return false;
        }
    }

    /**
     * Trigger Smart Pause for a subscription
     * Preserves streak and sends friendly notification
     */
    async triggerSmartPause(subscription, currentBalance, requiredAmount) {
        try {
            // Update subscription to paused state
            await prisma.subscription.update({
                where: { id: subscription.id },
                data: {
                    isPaused: true,
                    pauseReason: 'LOW_BALANCE',
                    pausedAt: new Date(),
                    pauseNotifiedAt: new Date(),
                    // Keep streak intact! Don't reset it
                },
            });

            const formattedBalance = ethers.formatUnits(currentBalance, 6);
            const formattedRequired = ethers.formatUnits(requiredAmount, 6);

            console.log(`⏸️ Smart Paused: ${subscription.walletAddress} (Balance: $${formattedBalance}, Required: $${formattedRequired})`);

            // Send friendly notification
            if (subscription.user.notificationsEnabled) {
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
            const pausedSubs = await prisma.subscription.findMany({
                where: {
                    isPaused: true,
                    pauseReason: 'LOW_BALANCE',
                    autoResumeEnabled: true,
                },
                include: { user: true },
            });

            console.log(`Found ${pausedSubs.length} paused subscriptions to check`);

            let resumed = 0;

            for (const sub of pausedSubs) {
                const balance = await blockchainService.getUserUsdcBalance(sub.walletAddress);
                const required = ethers.parseUnits(sub.dailyAmount.toString(), 6);

                // Require at least 3 days of savings to auto-resume
                const resumeThreshold = required * 3n;

                if (balance >= resumeThreshold) {
                    // Resume subscription
                    await prisma.subscription.update({
                        where: { id: sub.id },
                        data: {
                            isPaused: false,
                            pauseReason: null,
                            pausedAt: null,
                            pauseNotifiedAt: null,
                        },
                    });

                    const formattedBalance = ethers.formatUnits(balance, 6);
                    console.log(`▶️ Auto-resumed: ${sub.walletAddress} (Balance: $${formattedBalance})`);

                    // Send celebratory notification
                    if (sub.user.notificationsEnabled) {
                        await notificationService.sendAutoResumeNotification(sub.user);
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
            const sub = await prisma.subscription.findUnique({
                where: { walletAddress },
                include: { user: true },
            });

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

            // Resume subscription
            await prisma.subscription.update({
                where: { walletAddress },
                data: {
                    isPaused: false,
                    pauseReason: null,
                    pausedAt: null,
                    pauseNotifiedAt: null,
                },
            });

            console.log(`▶️ Manually resumed: ${walletAddress}`);

            // Send confirmation notification
            if (sub.user.notificationsEnabled) {
                await notificationService.sendManualResumeNotification(sub.user);
            }

            return { success: true };
        } catch (error) {
            console.error(`Failed to manually resume ${walletAddress}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Apply auto-increases for eligible subscriptions
     * Runs before daily deductions to update amounts
     */
    async applyAutoIncreases() {
        console.log('📈 Checking for auto-increase eligibility...');

        try {
            // Find subscriptions with auto-increase enabled
            const eligibleSubs = await prisma.subscription.findMany({
                where: {
                    isActive: true,
                    isPaused: false,
                    autoIncreaseEnabled: true,
                    autoIncreaseType: { not: null },
                    autoIncreaseAmount: { not: null },
                },
                include: { user: true },
            });

            if (eligibleSubs.length === 0) {
                console.log('📈 No subscriptions with auto-increase enabled');
                return { increased: 0 };
            }

            console.log(`📈 Found ${eligibleSubs.length} subscriptions with auto-increase enabled`);

            let increasedCount = 0;
            const now = new Date();

            for (const sub of eligibleSubs) {
                const shouldIncrease = this.shouldApplyAutoIncrease(sub, now);

                if (shouldIncrease) {
                    const result = await this.applyAutoIncrease(sub);
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
            // First increase: check if subscription is old enough
            const startDate = subscription.startDate || subscription.createdAt;
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
            const currentAmount = parseFloat(subscription.dailyAmount.toString());
            const increaseAmount = parseFloat(subscription.autoIncreaseAmount.toString());
            const maxAmount = subscription.autoIncreaseMaxAmount
                ? parseFloat(subscription.autoIncreaseMaxAmount.toString())
                : null;

            let newAmount;

            if (subscription.autoIncreaseType === 'FIXED') {
                // Fixed increase: add flat amount (e.g., +$0.50)
                newAmount = currentAmount + increaseAmount;
            } else if (subscription.autoIncreaseType === 'PERCENTAGE') {
                // Percentage increase: add percentage of current amount
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
            await prisma.subscription.update({
                where: { id: subscription.id },
                data: {
                    dailyAmount: newAmount,
                    lastAutoIncreaseAt: new Date(),
                },
            });

            const increaseType = subscription.autoIncreaseType === 'FIXED'
                ? `+$${increaseAmount}`
                : `+${increaseAmount}%`;

            console.log(`📈 Auto-increased: ${subscription.walletAddress} ($${currentAmount} → $${newAmount}) [${increaseType}]`);

            // Send notification if enabled
            if (subscription.user.notificationsEnabled) {
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
