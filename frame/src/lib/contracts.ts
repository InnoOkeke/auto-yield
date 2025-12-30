import { VAULT_ABI, ERC20_ABI } from './abis';

const VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`;
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`;

if (!VAULT_ADDRESS || !USDC_ADDRESS) {
    console.warn('Missing contract addresses in environment variables');
}

export const AUTO_YIELD_VAULT_CONTRACT = {
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
} as const;

export const USDC_CONTRACT = {
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
} as const;
