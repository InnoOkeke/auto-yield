'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { VAULT_ABI } from '@/lib/abi';
import { useRouter } from 'next/navigation';
import { parseUnits, formatUnits } from 'viem';
import axios from 'axios';
import AutoIncreaseCard from '@/components/AutoIncreaseCard';

export default function SettingsPage() {
    const router = useRouter();
    const { address } = useAccount();
    const [amount, setAmount] = useState('');
    const [sendingTest, setSendingTest] = useState(false);

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
        <div className="p-4 md:p-8 min-h-[calc(100vh-8rem)]">
            <div className="container mx-auto max-w-lg space-y-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-foreground font-display">Settings</h1>
                    <p className="text-muted">Manage your AutoYield preferences</p>
                </div>

                {/* Daily Amount Section */}
                <div className="glass-dark rounded-3xl p-6 border border-foreground/10 shadow-lg">
                    <h2 className="text-xl font-semibold text-foreground mb-4 font-display">Daily Amount</h2>

                    <div className="mb-6">
                        <label className="text-muted block mb-2 font-medium">Daily Savings (USDC)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted/60 font-bold">$</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full pl-8 pr-4 py-4 rounded-xl glass text-foreground text-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary border border-foreground/5"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => router.back()}
                            className="flex-1 py-3 rounded-xl glass hover:bg-black/5 dark:hover:bg-white/20 text-foreground font-semibold border border-foreground/5"
                            disabled={isWritePending || isConfirming}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpdate}
                            disabled={isWritePending || isConfirming || isSuccess}
                            className="flex-1 py-3 rounded-xl bg-primary hover:opacity-90 transition-all text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isWritePending ? 'Check Wallet...' : isConfirming ? 'Updating...' : isSuccess ? 'Updated!' : 'Update Amount'}
                        </button>
                    </div>

                    {isSuccess && (
                        <p className="text-green-400 text-center mt-4 text-sm">
                            Subscription updated successfully! Redirecting...
                        </p>
                    )}
                </div>

                {/* Auto-Increase Rule Section */}
                {address && <AutoIncreaseCard address={address} />}

                {/* Notifications Section */}
                <div className="glass-dark rounded-3xl p-6 border border-foreground/10 shadow-lg">
                    <h2 className="text-xl font-semibold text-foreground mb-4 font-display">Notifications</h2>
                    <p className="text-muted text-sm mb-4">
                        Test if your Farcaster notifications are configured correctly.
                    </p>
                    <button
                        onClick={async () => {
                            console.log('🔔 Test Notification clicked');
                            if (!address) {
                                alert('Please connect your wallet first!');
                                return;
                            }

                            try {
                                setSendingTest(true);
                                const { sendTestNotification } = await import('@/lib/farcaster');
                                console.log('Sending test notification to:', address);
                                const result = await sendTestNotification(address, 0);
                                console.log('Test result:', result);

                                if (result.success) {
                                    alert('Test notification sent! Check your notifications.');
                                } else {
                                    alert('Failed to send test notification: ' + result.error);
                                }
                            } catch (e) {
                                console.error('Test notification error:', e);
                                alert('Error sending notification');
                            } finally {
                                setSendingTest(false);
                            }
                        }}
                        disabled={sendingTest}
                        className="w-full py-3 rounded-xl glass hover:bg-black/5 dark:hover:bg-white/20 text-foreground font-semibold border border-foreground/5 flex items-center justify-center gap-2"
                    >
                        <span>🔔</span> Send Test Notification
                    </button>
                </div>
            </div>
        </div>
    );
}

