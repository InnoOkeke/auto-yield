'use client';

import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { VAULT_ABI } from '@/lib/abi';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useEffect } from 'react';

export default function PausePage() {
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

    const handlePause = () => {
        if (!process.env.NEXT_PUBLIC_VAULT_ADDRESS) return;

        writeContract({
            address: process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`,
            abi: VAULT_ABI,
            functionName: 'unsubscribe',
        });
    };

    return (
        <div className="flex items-center justify-center p-4 min-h-[calc(100vh-8rem)]">
            <div className="w-full max-w-lg glass-dark rounded-3xl p-8 border border-white/10">
                <h1 className="text-3xl font-bold text-white mb-6">Pause Subscription</h1>

                <p className="text-white/70 mb-8">
                    Pausing will stop future daily deductions. You can resume anytime.
                    Your existing funds will continue to earn yield.
                </p>

                <div className="flex gap-4">
                    <button
                        onClick={() => router.back()}
                        className="flex-1 py-4 rounded-xl glass hover:bg-white/20 text-white font-semibold"
                        disabled={isWritePending || isConfirming}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handlePause}
                        disabled={isWritePending || isConfirming || isSuccess}
                        className="flex-1 py-4 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 hover:scale-105 transition-all text-white font-semibold disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                    >
                        {isWritePending ? 'Check Wallet...' : isConfirming ? 'Pausing...' : isSuccess ? 'Paused!' : 'Confirm Pause'}
                    </button>
                </div>
                {isSuccess && (
                    <p className="text-green-400 text-center mt-4 text-sm">
                        Subscription paused successfully! Redirecting...
                    </p>
                )}
            </div>
        </div>
    );
}
