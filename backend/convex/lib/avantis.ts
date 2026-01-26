import { blockchainService } from './blockchain';
import { ethers } from 'ethers';

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
