import { useCallback, useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, usePublicClient } from 'wagmi';
import { parseUnits, maxUint256 } from 'viem';
import { AUTO_YIELD_VAULT_CONTRACT, USDC_CONTRACT } from '../lib/contracts';

export function useAutoYield() {
    const { address } = useAccount();
    const [isApproving, setIsApproving] = useState(false);
    const [isSubscribing, setIsSubscribing] = useState(false);
    const publicClient = usePublicClient();

    const { writeContractAsync } = useWriteContract();

    // Read allowance
    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        ...USDC_CONTRACT,
        functionName: 'allowance',
        args: address ? [address, AUTO_YIELD_VAULT_CONTRACT.address] : undefined,
        query: {
            enabled: !!address,
        },
    });

    const approve = useCallback(async () => {
        if (!address) throw new Error('Wallet not connected');
        setIsApproving(true);
        try {
            console.log('Approving USDC...');
            const hash = await writeContractAsync({
                ...USDC_CONTRACT,
                functionName: 'approve',
                args: [AUTO_YIELD_VAULT_CONTRACT.address, maxUint256],
            });

            // Wait for transaction receipt
            if (publicClient) {
                await publicClient.waitForTransactionReceipt({ hash });
                await refetchAllowance();
            }

            return hash;
        } catch (error) {
            console.error('Approval failed:', error);
            throw error;
        } finally {
            setIsApproving(false);
        }
    }, [address, writeContractAsync, publicClient, refetchAllowance]);

    const subscribe = useCallback(async (dailyAmountStr: string) => {
        if (!address) throw new Error('Wallet not connected');
        setIsSubscribing(true);

        try {
            const amount = parseUnits(dailyAmountStr, 6); // USDC has 6 decimals

            console.log('Subscribing...');
            const hash = await writeContractAsync({
                ...AUTO_YIELD_VAULT_CONTRACT,
                functionName: 'subscribe',
                args: [amount],
            });

            // Wait for receipt if possible, or just return hash
            if (publicClient) {
                await publicClient.waitForTransactionReceipt({ hash });
            }

            return hash;
        } catch (error) {
            console.error('Subscription failed:', error);
            throw error;
        } finally {
            setIsSubscribing(false);
        }
    }, [address, writeContractAsync, publicClient]);

    return {
        allowance,
        approve,
        subscribe,
        isApproving,
        isSubscribing,
        refetchAllowance
    };
}
