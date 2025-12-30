import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

// ABI imports - simplified for core functions
const VAULT_ABI = [
    'function subscriptions(address) view returns (uint256 dailyAmount, bool isActive, uint256 startDate, uint256 lastDeduction)',
    'function executeDailyDeduction(address user) external',
    'function batchExecuteDeductions(address[] users) external',
    'function avantisLPShares(address) view returns (uint256)',
    'function getUserTotalValue(address) view returns (uint256)',
    'function canDeductToday(address) view returns (bool)',
    'event DailyDeductionExecuted(address indexed user, uint256 amount, uint256 avantisShares, uint256 timestamp)',
    'event Subscribed(address indexed user, uint256 dailyAmount, uint256 timestamp)',
    'event Unsubscribed(address indexed user, uint256 timestamp)',
];

const AVANTIS_VAULT_ABI = [
    'function totalAssets() view returns (uint256)',
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address) view returns (uint256)',
];

export class BlockchainService {
    constructor() {
        this.provider = new ethers.JsonRpcProvider(
            process.env.BASE_RPC_URL || 'https://mainnet.base.org'
        );

        this.wallet = new ethers.Wallet(
            process.env.OPERATOR_PRIVATE_KEY,
            this.provider
        );

        this.vaultContract = new ethers.Contract(
            process.env.VAULT_ADDRESS,
            VAULT_ABI,
            this.wallet
        );

        this.avantisContract = new ethers.Contract(
            process.env.AVANTIS_LP_VAULT,
            AVANTIS_VAULT_ABI,
            this.provider
        );
    }

    /**
     * Execute daily deduction for a single user
     */
    async executeDailyDeduction(userAddress) {
        try {
            const tx = await this.vaultContract.executeDailyDeduction(userAddress, {
                gasLimit: 500000,
            });

            const receipt = await tx.wait();

            return {
                success: true,
                txHash: receipt.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
            };
        } catch (error) {
            console.error(`Failed to execute deduction for ${userAddress}:`, error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Batch execute deductions for multiple users
     */
    async batchExecuteDeductions(userAddresses) {
        try {
            const tx = await this.vaultContract.batchExecuteDeductions(userAddresses, {
                gasLimit: 200000 * userAddresses.length,
            });

            const receipt = await tx.wait();

            return {
                success: true,
                txHash: receipt.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                processedUsers: userAddresses.length,
            };
        } catch (error) {
            console.error('Batch deduction failed:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Get subscription details for a user
     */
    async getSubscription(userAddress) {
        try {
            const sub = await this.vaultContract.subscriptions(userAddress);

            return {
                dailyAmount: sub.dailyAmount.toString(),
                isActive: sub.isActive,
                startDate: Number(sub.startDate),
                lastDeduction: Number(sub.lastDeduction),
            };
        } catch (error) {
            console.error(`Failed to fetch subscription for ${userAddress}:`, error);
            return null;
        }
    }

    /**
     * Check if user can be deducted today
     */
    async canDeductToday(userAddress) {
        try {
            return await this.vaultContract.canDeductToday(userAddress);
        } catch (error) {
            console.error(`Failed to check deduction eligibility for ${userAddress}:`, error);
            return false;
        }
    }

    /**
     * Get user's total value in USDC
     */
    async getUserTotalValue(userAddress) {
        try {
            const value = await this.vaultContract.getUserTotalValue(userAddress);
            return value.toString();
        } catch (error) {
            console.error(`Failed to get total value for ${userAddress}:`, error);
            return '0';
        }
    }

    /**
     * Get user's AvantisFi LP shares
     */
    async getUserLPShares(userAddress) {
        try {
            const shares = await this.vaultContract.avantisLPShares(userAddress);
            return shares.toString();
        } catch (error) {
            console.error(`Failed to get LP shares for ${userAddress}:`, error);
            return '0';
        }
    }

    /**
     * Get AvantisFi vault stats
     */
    async getAvantisVaultStats() {
        try {
            const [totalAssets, totalSupply] = await Promise.all([
                this.avantisContract.totalAssets(),
                this.avantisContract.totalSupply(),
            ]);

            return {
                totalAssets: totalAssets.toString(),
                totalSupply: totalSupply.toString(),
                sharePrice: totalSupply > 0n
                    ? (totalAssets * 10000n / totalSupply).toString()
                    : '10000', // 1:1 if no shares
            };
        } catch (error) {
            console.error('Failed to fetch AvantisFi stats:', error);
            return null;
        }
    }

    /**
     * Get relayer (operator) wallet balance
     */
    async getRelayerBalance() {
        try {
            const balance = await this.provider.getBalance(this.wallet.address);
            return ethers.formatEther(balance);
        } catch (error) {
            console.error('Failed to get relayer balance:', error);
            return '0';
        }
    }

    /**
     * Monitor blockchain events
     */
    async subscribeToEvents(eventName, callback) {
        this.vaultContract.on(eventName, callback);
    }

    /**
     * Estimate gas for batch deduction
     */
    async estimateDeductionGas(userAddresses) {
        try {
            const gasEstimate = await this.vaultContract.batchExecuteDeductions.estimateGas(
                userAddresses
            );
            return gasEstimate.toString();
        } catch (error) {
            console.error('Failed to estimate gas:', error);
            return null;
        }
    }
}

export default new BlockchainService();
