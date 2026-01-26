import { ethers } from 'ethers';
import { createPublicClient, http, createClient } from 'viem';
import { base } from 'viem/chains';
import { paymasterActions } from 'viem/account-abstraction';
import { privateKeyToAccount } from 'viem/accounts';
import { createSmartAccountClient } from 'permissionless';
import { toSimpleSmartAccount } from 'permissionless/accounts';

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
    provider: ethers.JsonRpcProvider;
    wallet: ethers.Wallet;
    vaultContract: ethers.Contract;
    avantisContract: ethers.Contract;
    smartAccountClient: any; // Type as any for now to avoid extensive type definitions

    constructor() {
        const vaultAddress = process.env.VAULT_ADDRESS || process.env.NEXT_PUBLIC_VAULT_ADDRESS;

        if (!vaultAddress) {
            throw new Error('VAULT_ADDRESS is required');
        }

        this.provider = new ethers.JsonRpcProvider(
            process.env.BASE_RPC_URL || 'https://mainnet.base.org'
        );

        if (!process.env.OPERATOR_PRIVATE_KEY) {
            throw new Error('OPERATOR_PRIVATE_KEY is required');
        }

        this.wallet = new ethers.Wallet(
            process.env.OPERATOR_PRIVATE_KEY,
            this.provider
        );

        this.vaultContract = new ethers.Contract(
            vaultAddress,
            VAULT_ABI,
            this.wallet
        );

        this.avantisContract = new ethers.Contract(
            process.env.AVANTIS_LP_VAULT || '0x944766f715b51967E56aFdE5f0Aa76cEaCc9E7f9',
            AVANTIS_VAULT_ABI,
            this.provider
        );
    }

    async setupSmartAccount() {
        try {
            const paymasterUrl = process.env.PAYMASTER_URL;
            if (!paymasterUrl) {
                console.log('ℹ️ PAYMASTER_URL not found, using standard EOA wallet for transactions');
                return;
            }

            const privateKey = process.env.OPERATOR_PRIVATE_KEY as `0x${string}`;
            if (!privateKey) throw new Error("Missing Private Key");

            const owner = privateKeyToAccount(privateKey);

            const publicClient = createPublicClient({
                chain: base,
                transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org'),
            });

            // @ts-ignore - permissionless/viem types can be strict
            const account = await toSimpleSmartAccount({
                client: publicClient,
                owner: owner,
                factoryAddress: process.env.FACTORY_ADDRESS as `0x${string}`,
            });

            this.smartAccountClient = createSmartAccountClient({
                account,
                chain: base,
                bundlerTransport: http(paymasterUrl),
                middleware: {
                    sponsorUserOperation: async ({ userOperation }) => {
                        const paymasterClient = createClient({
                            chain: base,
                            transport: http(paymasterUrl),
                        }).extend(paymasterActions);

                        return paymasterClient.sponsorUserOperation({
                            userOperation,
                        });
                    },
                },
            });

            console.log(`✅ Smart Account initialized: ${account.address}`);
        } catch (error) {
            console.error('❌ Error setting up Smart Account:', error);
        }
    }

    async executeDailyDeduction(userAddress: string) {
        if (!this.smartAccountClient) await this.setupSmartAccount();

        try {
            if (this.smartAccountClient) {
                console.log(`Executing gasless deduction for ${userAddress}`);
                const hash = await this.smartAccountClient.writeContract({
                    address: this.vaultContract.target as `0x${string}`,
                    abi: VAULT_ABI,
                    functionName: 'executeDailyDeduction',
                    args: [userAddress],
                });

                return {
                    success: true,
                    txHash: hash,
                    blockNumber: 0,
                    gasUsed: '0',
                };
            }

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
        } catch (error: any) {
            console.error(`Failed to execute deduction for ${userAddress}:`, error);
            return { success: false, error: error.message };
        }
    }

    async batchExecuteDeductions(userAddresses: string[]) {
        if (!this.smartAccountClient) await this.setupSmartAccount();

        try {
            if (this.smartAccountClient) {
                console.log(`Executing gasless batch deduction for ${userAddresses.length} users`);
                const hash = await this.smartAccountClient.writeContract({
                    address: this.vaultContract.target as `0x${string}`,
                    abi: VAULT_ABI,
                    functionName: 'batchExecuteDeductions',
                    args: [userAddresses],
                });

                return {
                    success: true,
                    txHash: hash,
                    blockNumber: 0,
                    gasUsed: '0',
                    processedUsers: userAddresses.length,
                };
            }

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
        } catch (error: any) {
            console.error('Batch deduction failed:', error);
            return { success: false, error: error.message };
        }
    }

    async getSubscription(userAddress: string) {
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

    async canDeductToday(userAddress: string) {
        try {
            return await this.vaultContract.canDeductToday(userAddress);
        } catch (error) {
            return false;
        }
    }

    async getUserTotalValue(userAddress: string) {
        try {
            const value = await this.vaultContract.getUserTotalValue(userAddress);
            return value.toString();
        } catch (error) {
            return '0';
        }
    }

    async getUserLPShares(userAddress: string) {
        try {
            const shares = await this.vaultContract.avantisLPShares(userAddress);
            return shares.toString();
        } catch (error) {
            return '0';
        }
    }

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
                    : '10000',
            };
        } catch (error) {
            return null;
        }
    }

    async getRelayerBalance() {
        try {
            const balance = await this.provider.getBalance(this.wallet.address);
            return ethers.formatEther(balance);
        } catch (error) {
            console.error('Failed to get relayer balance:', error);
            return '0';
        }
    }

    async getUserUsdcBalance(userAddress: string) {
        try {
            const USDC_ADDRESS = process.env.USDC_ADDRESS || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
            const ERC20_ABI = ['function balanceOf(address) view returns (uint256)'];
            const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, this.provider);
            const balance = await usdcContract.balanceOf(userAddress);
            return balance;
        } catch (error) {
            console.error(`Failed to get USDC balance for ${userAddress}:`, error);
            return 0n;
        }
    }
}

export const blockchainService = new BlockchainService();
