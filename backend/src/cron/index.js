import cron from 'node-cron';
import deductionService from '../services/deduction.js';
import avantisService from '../services/avantis.js';

export function startCronJobs() {
    // Daily deduction job - runs at midnight UTC
    const deductionSchedule = process.env.DEDUCTION_CRON_SCHEDULE || '0 0 * * *';

    cron.schedule(deductionSchedule, async () => {
        console.log('⏰ Cron: Starting daily deduction job');
        try {
            const result = await deductionService.processDailyDeductions();
            console.log(`Cron: Deduction job completed - ${result.processed} processed, ${result.failed} failed`);
        } catch (error) {
            console.error('Cron: Deduction job failed:', error);
        }
    });

    console.log(`📅 Daily deduction cron scheduled: ${deductionSchedule}`);

    // Relayer balance check - runs every 6 hours
    cron.schedule('0 */6 * * *', async () => {
        console.log('⏰ Cron: Checking relayer balance');
        try {
            const balance = await deductionService.checkRelayerBalance();
            console.log(`Cron: Relayer balance: ${balance} ETH`);
        } catch (error) {
            console.error('Cron: Relayer balance check failed:', error);
        }
    });

    console.log('📅 Relayer balance check cron scheduled: every 6 hours');

    // Yield snapshot - runs every 4 hours
    cron.schedule('0 */4 * * *', async () => {
        console.log('⏰ Cron: Creating yield snapshot');
        try {
            await avantisService.createYieldSnapshot();
            console.log('Cron: Yield snapshot created');
        } catch (error) {
            console.error('Cron: Yield snapshot failed:', error);
        }
    });

    console.log('📅 Yield snapshot cron scheduled: every 4 hours');

    // AvantisFi vault health check - runs every hour
    cron.schedule('0 * * * *', async () => {
        console.log('⏰ Cron: Monitoring AvantisFi vault health');
        try {
            const health = await avantisService.monitorVaultHealth();
            if (!health.healthy) {
                console.error(`🚨 Vault health issue: ${health.reason}`);
            }
        } catch (error) {
            console.error('Cron: Vault health check failed:', error);
        }
    });

    console.log('📅 Vault health check cron scheduled: hourly');

    // Smart Pause auto-resume check - runs every 2 hours
    cron.schedule('0 */2 * * *', async () => {
        console.log('⏰ Cron: Checking paused subscriptions for auto-resume');
        try {
            const result = await deductionService.checkAndResumeSubscriptions();
            console.log(`Cron: Auto-resume check completed - ${result.resumed || 0} resumed`);
        } catch (error) {
            console.error('Cron: Auto-resume check failed:', error);
        }
    });

    console.log('📅 Smart Pause auto-resume cron scheduled: every 2 hours');
}
