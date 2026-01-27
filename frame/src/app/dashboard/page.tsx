'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAccount, useConnect } from 'wagmi';
import YieldStats from '@/components/YieldStats';
import StreakCard from '@/components/StreakCard';
import SummaryCard from '@/components/SummaryCard';
import SmartPauseCard from '@/components/SmartPauseCard';
import ActivityFeed from '@/components/ActivityFeed';
import QuickActions from '@/components/QuickActions';
import YieldChart from '@/components/YieldChart';
import axios from 'axios';
import Link from 'next/link';
import { Activity, CheckCircle, Smartphone } from 'lucide-react';

export default function DashboardPage() {
    const { address, isConnected } = useAccount();
    const { connect, connectors } = useConnect();
    const [userData, setUserData] = useState<any>(null);
    const [pauseData, setPauseData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const handleConnect = async () => {
        try {
            const isFarcasterEnv = !!(window as any).farcaster?.context;
            const injectedWallet = connectors.find(c => c.id === 'injected' || c.id === 'metaMask' || c.id === 'io.metamask');
            const fcWallet = connectors.find(c => c.id === 'farcaster' || c.name.toLowerCase().includes('farcaster'));

            const targetConnector = isFarcasterEnv ? (fcWallet || injectedWallet) : (injectedWallet || connectors[0]);

            if (targetConnector) {
                await connect({ connector: targetConnector });
            }
        } catch (error) {
            console.error('Connection failed:', error);
        }
    };

    const fetchUserData = useCallback(async () => {
        try {
            const [userResponse, pauseResponse] = await Promise.all([
                axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/user/${address}`),
                axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/subscription/pause-status/${address}`).catch(() => null),
            ]);

            setUserData(userResponse.data);
            if (pauseResponse?.data) {
                setPauseData(pauseResponse.data);
            }
        } catch (error) {
            console.error('Failed to fetch user data:', error);
        } finally {
            setLoading(false);
        }
    }, [address]);

    useEffect(() => {
        if (isConnected && address) {
            fetchUserData();
        }
    }, [isConnected, address, fetchUserData]);

    if (!isConnected) {
        return (
            <div className="flex items-center justify-center p-4 min-h-[calc(100vh-8rem)]">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-foreground mb-4">Connect Your Wallet</h1>
                    <p className="text-muted mb-8 text-lg">Please connect your wallet to view your dashboard</p>
                    <button
                        onClick={handleConnect}
                        className="inline-block px-6 py-3 bg-primary-50 dark:bg-primary-600 text-primary-600 dark:text-white border border-primary-600 dark:border-transparent rounded-xl font-semibold hover:opacity-90 transition-all shadow-md text-sm"
                    >
                        Connect Wallet
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-foreground/10 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8">
            <div className="container mx-auto max-w-7xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 font-display">
                                Your AutoYield Dashboard
                            </h1>
                            <p className="text-muted font-medium bg-black/5 dark:bg-white/5 py-1 px-3 rounded-full inline-block text-sm border border-foreground/5">
                                {address?.slice(0, 6)}...{address?.slice(-4)}
                            </p>
                        </div>
                        <QuickActions />
                    </div>

                    {/* Subscription Status Banner */}
                    {pauseData?.isPaused ? (
                        <div className="glass-dark rounded-3xl p-5 border-l-4 border-amber-500 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                                    <Activity className="w-6 h-6 animate-pulse" />
                                </div>
                                <div>
                                    <p className="text-foreground font-black uppercase tracking-widest text-xs mb-1">Status: Paused</p>
                                    <p className="text-secondary-500 text-[10px] font-bold uppercase tracking-widest">
                                        Overdraft Protection Active • Streak Secure
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : userData?.user?.subscription?.isActive && (
                        <div className="glass-dark rounded-3xl p-5 border-l-4 border-primary-500 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-500">
                                    <CheckCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-foreground font-black uppercase tracking-widest text-xs mb-1">Status: Operational</p>
                                    <p className="text-secondary-500 text-[10px] font-bold uppercase tracking-widest">
                                        Auto-save frequency: Daily • ${userData.user.subscription.dailyAmount} USDC
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Stats */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Smart Pause Card - Show prominently when paused */}
                        {pauseData?.isPaused && (
                            <SmartPauseCard
                                pauseData={pauseData}
                                address={address!}
                                onResume={() => {
                                    setPauseData(null);
                                    fetchUserData();
                                }}
                            />
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <StreakCard
                                currentStreak={pauseData?.currentStreak || userData?.user?.subscription?.currentStreak || 0}
                                bestStreak={pauseData?.bestStreak || userData?.user?.subscription?.bestStreak || 0}
                            />
                            <SummaryCard
                                totalDeposited={userData?.yield?.totalDeposited || '0.00'}
                                yieldEarned={userData?.yield?.yieldEarned || '0.00'}
                                currentStreak={pauseData?.currentStreak || userData?.user?.subscription?.currentStreak || 0}
                                dailyAmount={userData?.user?.subscription?.dailyAmount?.toString() || '0.00'}
                                currentValue={userData?.yield?.currentValue || '0.00'}
                            />
                        </div>

                        <YieldStats yieldData={userData?.yield} />

                        {/* Yield Performance Chart */}
                        <YieldChart yieldData={userData?.yield} />
                    </div>

                    {/* Right Column - Activity */}
                    <div className="space-y-6">
                        <ActivityFeed address={address!} />

                        {/* Info Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="glass-dark rounded-3xl p-8 border border-foreground/5 shadow-sm bg-primary-500/[0.02]"
                        >
                            <h3 className="text-xs font-black text-foreground mb-6 uppercase tracking-[0.2em]">Strategy Overview</h3>
                            <div className="space-y-4">
                                {[
                                    '24/7 Yield via AvantisFi',
                                    'Instant non-custodial withdrawals',
                                    'Automated, gas-free deposits',
                                    'Secure onchain vault logic'
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                                        <p className="text-[10px] text-secondary-500 uppercase font-black tracking-widest">{item}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
