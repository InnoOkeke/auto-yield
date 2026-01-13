'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { parseUnits } from 'viem';
import ConnectWallet from '@/components/ConnectWallet';
import SubscriptionForm from '@/components/SubscriptionForm';
import { useAccount } from 'wagmi';
import { useAutoYield } from '@/hooks/useAutoYield';
import { getFarcasterUser } from '@/lib/farcaster';
import axios from 'axios';

export default function OnboardPage() {
    const { address, isConnected } = useAccount();
    const router = useRouter();
    const [step, setStep] = useState<'connect' | 'amount' | 'confirm'>('connect');
    const [username, setUsername] = useState<string | null>(null);
    const [apy, setApy] = useState<string>('9.45');
    const [dailyAmount, setDailyAmount] = useState('10');

    useEffect(() => {
        // Initialize from cache if available
        const cached = window.localStorage.getItem('cached_apy');
        if (cached) setApy(cached);

        // Fetch APY for display
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stats`)
            .then(r => r.json())
            .then(d => {
                if (d?.vault?.apy) {
                    const val = Number(d.vault.apy).toFixed(2);
                    window.localStorage.setItem('cached_apy', val);
                    setApy(val);
                }
            })
            .catch(console.error);

        // Fetch Farcaster User
        getFarcasterUser().then(user => {
            if (user?.username) setUsername(user.username);
        });
    }, []);

    return (
        <div className="flex items-center justify-center p-4 min-h-[calc(100vh-8rem)]">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl"
            >
                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-muted text-sm font-medium">Step {step === 'connect' ? 1 : step === 'amount' ? 2 : 3} of 3</span>
                        <span className="text-foreground font-semibold">
                            {step === 'connect' && 'Connect Wallet'}
                            {step === 'amount' && 'Choose Amount'}
                            {step === 'confirm' && 'Confirm'}
                        </span>
                    </div>
                    <div className="h-2 bg-foreground/10 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-primary-500 shadow-sm"
                            initial={{ width: '0%' }}
                            animate={{
                                width: step === 'connect' ? '33%' : step === 'amount' ? '66%' : '100%',
                            }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                </div>

                {/* Main Card */}
                <div className="glass-dark rounded-3xl p-8 backdrop-blur-xl">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-foreground mb-3 font-display">
                            {step === 'connect' && (username ? `🚀 Welcome, @${username}!` : '🚀 Welcome to AutoYield')}
                            {step === 'amount' && '💵 Set Your Daily Savings'}
                            {step === 'confirm' && '✅ Almost There!'}
                        </h1>
                        <p className="text-muted text-lg font-medium">
                            {step === 'connect' && 'Connect your wallet to start earning'}
                            {step === 'amount' && 'Choose how much to save daily'}
                            {step === 'confirm' && 'Review and confirm your subscription'}
                        </p>
                    </div>

                    {/* Step Content */}
                    {step === 'connect' && (
                        <div className="space-y-6">
                            <div className="text-center">
                                {/* User requested to remove connect button here, relying on Header for sign in */}
                                <p className="text-foreground/80 mb-6 font-medium">
                                    Please sign in using the button in the top right to continue.
                                </p>
                                {!isConnected && (
                                    <div className="animate-pulse text-sm text-primary-600 dark:text-accent-400 font-bold">
                                        Waiting for sign in...
                                    </div>
                                )}
                                {isConnected && (
                                    <button
                                        onClick={() => setStep('amount')}
                                        className="py-2.5 px-6 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold transition-all text-sm"
                                    >
                                        Continue to Savings ➝
                                    </button>
                                )}
                            </div>

                            <div className="glass rounded-2xl p-6 space-y-4 border border-foreground/5 shadow-sm">
                                <h3 className="text-xl font-semibold text-foreground mb-4 font-display">Why AutoYield?</h3>
                                <div className="space-y-3">
                                    {[
                                        { icon: '⚡', title: 'Low Fees', desc: 'Minimal transaction costs on Base' },
                                        { icon: '🔄', title: 'Automated', desc: 'Daily deductions, zero effort' },
                                        { icon: '📈', title: 'Earn Yield', desc: 'Immediate AvantisFi deposits' },
                                        { icon: '🔐', title: 'Secure', desc: 'Non-custodial, you own your funds' },
                                    ].map((feature, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <span className="text-2xl">{feature.icon}</span>
                                            <div>
                                                <p className="text-foreground font-semibold">{feature.title}</p>
                                                <p className="text-muted text-sm font-medium">{feature.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'amount' && (
                        <SubscriptionForm
                            onBack={() => setStep('connect')}
                            onNext={() => setStep('confirm')}
                            apy={Number(apy)}
                            amount={dailyAmount}
                            onChange={setDailyAmount}
                        />
                    )}

                    {step === 'confirm' && (
                        <div className="space-y-6">
                            <ConfirmStep onBack={() => setStep('amount')} apy={apy} dailyAmount={dailyAmount} />
                        </div>
                    )}
                </div>

                {/* Info Footer */}
                <div className="mt-6 text-center text-muted text-sm font-medium">
                    <p>Powered by Base Network • Secured by Smart Contracts</p>
                </div>
            </motion.div>
        </div>
    );
}

function ConfirmStep({ onBack, apy, dailyAmount }: { onBack: () => void, apy: string, dailyAmount?: string }) {
    const { subscribe, approve, allowance, isApproving, isSubscribing } = useAutoYield();
    const { address } = useAccount();
    const router = useRouter();

    // TODO: Pass dynamic amount from step 2
    const dailyAmountStr = dailyAmount || '10';
    const amountBigInt = parseUnits(dailyAmountStr, 6);

    // Check if we have enough allowance
    // Use a small buffer if needed, or exact comparison.
    // 365 days buffer is what we checked for previously, let's just check for > amount for now
    // or maybe check for at least 1 day. 
    // The previous logic checked for 365 days, let's stick to simple amount check for the button state
    // but the approve function approves maxUint256.

    // NOTE: allowance is bigint or undefined.
    // If undefined, assume 0 (false).
    const isAllowanceSufficient = allowance ? allowance >= amountBigInt : false;

    const handleApprove = async () => {
        try {
            await approve(dailyAmountStr);
            // Toast or alert?
        } catch (error) {
            console.error('Approval failed', error);
            alert('Approval failed. Please try again.');
        }
    };

    const handleConfirm = async () => {
        if (!address) return;

        try {
            const txHash = await subscribe(dailyAmountStr);
            console.log('Transaction submitted:', txHash);

            // Sync user with backend (via secure proxy)
            try {
                await axios.post('/api/proxy/sync-user', {
                    walletAddress: address,
                    farcasterFid: 0, // Default for non-farcaster users
                    username: 'User', // Placeholder
                });
            } catch (syncError) {
                console.error('Failed to sync user:', syncError);
                // Continue anyway as transaction succeeded
            }

            // Redirect using router
            router.push('/dashboard');
        } catch (error) {
            console.error('Subscription failed', error);
            alert('Transaction failed. Please try again.');
        }
    };

    return (
        <>
            <div className="glass rounded-2xl p-6 space-y-4 border border-foreground/5 shadow-sm">
                <h3 className="text-xl font-semibold text-foreground font-display">Subscription Summary</h3>
                <div className="space-y-3 text-muted font-medium">
                    <div className="flex justify-between">
                        <span>Daily Amount</span>
                        <span className="font-semibold text-foreground">${dailyAmountStr} USDC</span>
                    </div>
                    <div className="flex justify-between">
                        <span>First Deduction</span>
                        <span className="font-semibold text-foreground">Tomorrow 12:00 AM UTC</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Expected APY <span className="text-xs text-muted/60 font-mono">(Live)</span></span>
                        <span className="font-semibold text-green-500 dark:text-green-400">~{apy}%</span>
                    </div>
                    <div className="flex justify-between text-yellow-600 dark:text-yellow-400">
                        <span>Platform Fee</span>
                        <span className="font-semibold">0.5%</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Gas Fees</span>
                        <span className="font-semibold text-green-500 dark:text-green-400">Standard Network Fee</span>
                    </div>
                </div>
            </div>

            <div className="glass rounded-2xl p-6 bg-primary-500/5 border border-primary-500/20 shadow-sm">
                <p className="text-muted text-sm font-medium">
                    💡 <strong>Important:</strong> You can cancel anytime.
                    <br />Fees are deducted from deposits. 100% of yield is yours.
                </p>
            </div>

            <div className="flex gap-4">
                <button
                    onClick={onBack}
                    className="flex-1 py-4 rounded-xl glass hover:bg-black/5 dark:hover:bg-white/20 text-foreground font-semibold transition-all disabled:opacity-50 border border-foreground/5"
                >
                    Back
                </button>

                {!isAllowanceSufficient ? (
                    <button
                        onClick={handleApprove}
                        disabled={isApproving}
                        className="flex-1 py-4 rounded-xl bg-primary-50 dark:bg-primary-600 text-primary-600 dark:text-white border border-primary-600 dark:border-transparent font-semibold transition-all shadow-md disabled:opacity-50 animate-pulse-glow"
                    >
                        {isApproving ? 'Approving...' : 'Approve USDC'}
                    </button>
                ) : (
                    <button
                        onClick={handleConfirm}
                        disabled={isSubscribing}
                        className="flex-1 py-4 rounded-xl bg-primary-50 dark:bg-primary-600 text-primary-600 dark:text-white border border-primary-600 dark:border-transparent font-semibold transition-all shadow-md disabled:opacity-50 animate-pulse-glow"
                    >
                        {isSubscribing ? 'Confirming...' : 'Confirm Subscription'}
                    </button>
                )}
            </div>
        </>
    );
}
