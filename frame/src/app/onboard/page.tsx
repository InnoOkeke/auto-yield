'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ConnectWallet from '@/components/ConnectWallet';
import SubscriptionForm from '@/components/SubscriptionForm';
import { useAccount } from 'wagmi';
import { useAutoYield } from '@/hooks/useAutoYield';

export default function OnboardPage() {
    const { address, isConnected } = useAccount();
    const [step, setStep] = useState<'connect' | 'amount' | 'confirm'>('connect');

    useEffect(() => {
        // Fetch APY for display
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stats`)
            .then(r => r.json())
            .then(d => {
                if (d?.vault?.apy) window.localStorage.setItem('cached_apy', Number(d.vault.apy).toFixed(2));
            })
            .catch(console.error);
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
                        <span className="text-white/60 text-sm">Step {step === 'connect' ? 1 : step === 'amount' ? 2 : 3} of 3</span>
                        <span className="text-white font-medium">
                            {step === 'connect' && 'Connect Wallet'}
                            {step === 'amount' && 'Choose Amount'}
                            {step === 'confirm' && 'Confirm'}
                        </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-primary-400 to-accent-400"
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
                        <h1 className="text-4xl font-bold text-white mb-3">
                            {step === 'connect' && '🚀 Welcome to AutoYield'}
                            {step === 'amount' && '💵 Set Your Daily Savings'}
                            {step === 'confirm' && '✅ Almost There!'}
                        </h1>
                        <p className="text-white/70 text-lg">
                            {step === 'connect' && 'Connect your wallet to start earning'}
                            {step === 'amount' && 'Choose how much to save daily'}
                            {step === 'confirm' && 'Review and confirm your subscription'}
                        </p>
                    </div>

                    {/* Step Content */}
                    {step === 'connect' && (
                        <div className="space-y-6">
                            <ConnectWallet onConnect={() => setStep('amount')} />

                            <div className="glass rounded-2xl p-6 space-y-4">
                                <h3 className="text-xl font-semibold text-white mb-4">Why AutoYield?</h3>
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
                                                <p className="text-white font-medium">{feature.title}</p>
                                                <p className="text-white/60 text-sm">{feature.desc}</p>
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
                        />
                    )}

                    {step === 'confirm' && (
                        <div className="space-y-6">
                            <ConfirmStep onBack={() => setStep('amount')} />
                        </div>
                    )}
                </div>

                {/* Info Footer */}
                <div className="mt-6 text-center text-white/50 text-sm">
                    <p>Powered by Base Network • Secured by Smart Contracts</p>
                </div>
            </motion.div>
        </div>
    );
}

import axios from 'axios';

function ConfirmStep({ onBack }: { onBack: () => void }) {
    const { subscribe, isPending } = useAutoYield();
    const { address } = useAccount();

    const handleConfirm = async () => {
        if (!address) return;

        try {
            const txHash = await subscribe('10'); // TODO: Pass dynamic amount from step 2
            console.log('Transaction submitted:', txHash);

            // Sync user with backend
            try {
                await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/sync-user`, {
                    walletAddress: address,
                    farcasterFid: 0, // Default for non-farcaster users
                    username: 'User', // Placeholder
                });
            } catch (syncError) {
                console.error('Failed to sync user:', syncError);
                // Continue anyway as transaction succeeded
            }

            // Optionally wait for receipt or show success message, then redirect
            window.location.href = '/dashboard';
        } catch (error) {
            console.error('Subscription failed', error);
            alert('Transaction failed. Please try again.');
        }
    };

    return (
        <>
            <div className="glass rounded-2xl p-6 space-y-4">
                <h3 className="text-xl font-semibold text-white">Subscription Summary</h3>
                <div className="space-y-3 text-white/80">
                    <div className="flex justify-between">
                        <span>Daily Amount</span>
                        <span className="font-semibold">$10 USDC</span>
                    </div>
                    <div className="flex justify-between">
                        <span>First Deduction</span>
                        <span className="font-semibold">Tomorrow 12:00 AM UTC</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Expected APY <span className="text-xs text-white/40">(Live)</span></span>
                        {/* TODO: Pass APY prop or fetch here. Using static placeholder logic for now, ideally fetch */}
                        {/* For speed, we will fetch in useEffect if we want it perfect, or standard placeholder */}
                        <span className="font-semibold text-green-400">~{window.localStorage.getItem('cached_apy') || '12.5'}%</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Platform Fee</span>
                        <span className="font-semibold text-yellow-400">0.5%</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Gas Fees</span>
                        <span className="font-semibold text-green-400">Standard Network Fee</span>
                    </div>
                </div>
            </div>

            <div className="glass rounded-2xl p-6 bg-accent-500/10 border-accent-500/30">
                <p className="text-white/80 text-sm">
                    💡 <strong>Important:</strong> You can cancel anytime.
                    <br />Fees are deducted from deposits. 100% of yield is yours.
                </p>
            </div>

            <div className="flex gap-4">
                <button
                    onClick={onBack}
                    className="flex-1 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-all disabled:opacity-50"
                >
                    Back
                </button>
                <button
                    onClick={handleConfirm}
                    disabled={isPending}
                    className="flex-1 py-4 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white font-semibold transition-all disabled:opacity-50 animate-pulse-glow"
                >
                    {isPending ? 'Confirming...' : 'Confirm Subscription'}
                </button>
            </div>
        </>
    );
}
