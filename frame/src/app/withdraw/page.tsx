'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { VAULT_ABI } from '@/lib/abi';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useEffect } from 'react';

export default function WithdrawPage() {
    const router = useRouter();
    const { address } = useAccount();
    const { writeContract, data: hash, isPending: isWritePending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    useEffect(() => {
        if (isSuccess && address) {
            axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/subscription/sync`, { address })
                .catch(console.error)
                .finally(() => setTimeout(() => router.push('/dashboard'), 2000));
        }
    }, [isSuccess, address, router]);

    const handleWithdraw = () => {
        if (!process.env.NEXT_PUBLIC_VAULT_ADDRESS) {
            console.error('Vault address missing');
            return;
        }
        writeContract({
            address: process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`,
            abi: VAULT_ABI,
            functionName: 'withdraw',
        });
    };

    return (
        <div className="flex items-center justify-center p-4 min-h-[calc(100vh-8rem)]">
            <div className="w-full max-w-lg glass-dark rounded-3xl p-8 border border-foreground/10 shadow-lg">
                <h1 className="text-3xl font-bold text-foreground mb-6 font-display">Withdraw Funds</h1>

                <p className="text-muted mb-8 font-medium">
                    Withdrawal will redeem your AvantisFi LP shares and transfer USDC back to your wallet.
                    This handles the complete exit process.
                </p>

                <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-4 mb-8 border border-foreground/5 shadow-inner">
                    <p className="text-sm text-yellow-600 dark:text-yellow-400 font-bold mb-2">⚠️ Review</p>
                    <p className="text-xs text-muted font-medium">
                        This action will withdraw ALL your deposited funds and earnings.
                    </p>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={() => router.back()}
                        className="flex-1 py-4 rounded-xl glass hover:bg-black/5 dark:hover:bg-white/20 text-foreground font-semibold border border-foreground/5"
                        disabled={isWritePending || isConfirming}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleWithdraw}
                        disabled={isWritePending || isConfirming || isSuccess}
                        className="flex-1 py-4 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 hover:scale-105 transition-all text-white font-semibold disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                    >
                        {isWritePending ? 'Check Wallet...' : isConfirming ? 'Confirming...' : isSuccess ? 'Success!' : 'Confirm Withdraw'}
                    </button>
                </div>

                {isSuccess && (
                    <p className="text-green-400 text-center mt-4 text-sm">
                        Funds withdrawn successfully! Redirecting...
                    </p>
                )}
            </div>
        </div>
    );
}
