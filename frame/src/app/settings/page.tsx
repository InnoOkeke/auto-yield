'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { VAULT_ABI } from '@/lib/abi';
import { useRouter } from 'next/navigation';
import { parseUnits, formatUnits } from 'viem';
import axios from 'axios';

export default function SettingsPage() {
    const router = useRouter();
    const { address } = useAccount();
    const [amount, setAmount] = useState('');

    // Read current subscription
    const { data: subscription } = useReadContract({
        address: process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`,
        abi: VAULT_ABI,
        functionName: 'subscriptions',
        args: [address as `0x${string}`],
        query: { enabled: !!address }
    });

    useEffect(() => {
        if (subscription) {
            // subscription is [dailyAmount, isActive, startDate, lastDeduction]
            const currentAmount = (subscription as any)[0];
            // Convert from 6 decimals (USDC)
            setAmount(formatUnits(currentAmount, 6));
        }
    }, [subscription]);

    const { writeContract, data: hash, isPending: isWritePending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    useEffect(() => {
        if (isSuccess && address) {
            axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/subscription/sync`, { address })
                .catch(console.error)
                .finally(() => setTimeout(() => router.push('/dashboard'), 2000));
        }
    }, [isSuccess, address, router]);

    const handleUpdate = () => {
        if (!amount || !process.env.NEXT_PUBLIC_VAULT_ADDRESS) return;

        const amountBigInt = parseUnits(amount, 6); // USDC has 6 decimals

        writeContract({
            address: process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`,
            abi: VAULT_ABI,
            functionName: 'updateDailyAmount',
            args: [amountBigInt],
        });
    };

    return (
        <div className="flex items-center justify-center p-4 min-h-[calc(100vh-8rem)]">
            <div className="w-full max-w-lg glass-dark rounded-3xl p-8 border border-foreground/10 shadow-lg">
                <h1 className="text-3xl font-bold text-foreground mb-6 font-display">Adjust Daily Amount</h1>

                <div className="mb-8">
                    <label className="text-muted block mb-2 font-medium">New Daily Amount (USDC)</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted/60 font-bold">$</span>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full pl-8 pr-4 py-4 rounded-xl glass text-foreground text-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 border border-foreground/5"
                        />
                    </div>
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
                        onClick={handleUpdate}
                        disabled={isWritePending || isConfirming || isSuccess}
                        className="flex-1 py-4 rounded-xl bg-blue-600 hover:scale-105 transition-all text-white font-semibold disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                    >
                        {isWritePending ? 'Check Wallet...' : isConfirming ? 'Updating...' : isSuccess ? 'Updated!' : 'Update Amount'}
                    </button>
                </div>

                <div className="mt-8 pt-8 border-t border-foreground/10">
                    <h3 className="text-xl font-semibold text-foreground mb-4 font-display">Notifications</h3>
                    <p className="text-muted text-sm mb-4">
                        Test if your Farcaster notifications are configured correctly.
                    </p>
                    <button
                        onClick={async () => {
                            const { sendTestNotification } = await import('@/lib/farcaster');
                            if (address) {
                                const result = await sendTestNotification(address, 0);
                                if (result.success) {
                                    alert('Test notification sent! Check your Warpcast.');
                                } else {
                                    alert('Failed to send test notification: ' + result.error);
                                }
                            }
                        }}
                        className="w-full py-4 rounded-xl glass hover:bg-black/5 dark:hover:bg-white/20 text-foreground font-semibold border border-foreground/5 flex items-center justify-center gap-2"
                    >
                        <span>🔔</span> Send Test Notification
                    </button>
                </div>

                {isSuccess && (
                    <p className="text-green-400 text-center mt-4 text-sm">
                        Subscription updated successfully! Redirecting...
                    </p>
                )}
            </div>
        </div>
    );
}
