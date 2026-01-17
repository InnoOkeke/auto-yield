'use client';

import { useCallback } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { useSendCalls, useCallsStatus } from 'wagmi/experimental';
import { encodeFunctionData } from 'viem';

/**
 * Hook for sending sponsored transactions using Base Paymaster
 * This enables gasless transactions for users - required for Base App Featured status
 */
export function useSponsoredTransaction() {
    const { address } = useAccount();
    const publicClient = usePublicClient();

    const { sendCalls, data: callsResult, isPending, error } = useSendCalls();

    // Extract the ID string from the result object
    const callsId = typeof callsResult === 'string'
        ? callsResult
        : callsResult?.id;

    const sendSponsoredTransaction = useCallback(async ({
        contractAddress,
        abi,
        functionName,
        args,
    }: {
        contractAddress: `0x${string}`;
        abi: any[];
        functionName: string;
        args: any[];
    }) => {
        if (!address) throw new Error('Wallet not connected');

        const paymasterUrl = process.env.NEXT_PUBLIC_PAYMASTER_URL;

        // Encode the function call
        const data = encodeFunctionData({
            abi,
            functionName,
            args,
        });

        // Send with paymaster capabilities for gas sponsorship
        const result = await sendCalls({
            calls: [{
                to: contractAddress,
                data,
            }],
            capabilities: paymasterUrl ? {
                paymasterService: {
                    url: paymasterUrl,
                },
            } : undefined,
        });

        return result;
    }, [address, sendCalls]);

    // Get call status - only enable when we have a valid ID
    const { data: callStatus } = useCallsStatus({
        id: callsId ?? '',
        query: {
            enabled: !!callsId,
            refetchInterval: (data) =>
                data.state.data?.status === 'CONFIRMED' ? false : 1000,
        },
    });

    return {
        sendSponsoredTransaction,
        callsId,
        isPending,
        error,
        callStatus,
        isConfirmed: callStatus?.status === 'CONFIRMED',
        txHash: callStatus?.receipts?.[0]?.transactionHash,
    };
}

export default useSponsoredTransaction;

