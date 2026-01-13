'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAccount, useConnect } from 'wagmi';
import YieldStats from '@/components/YieldStats';
import ActivityFeed from '@/components/ActivityFeed';
import QuickActions from '@/components/QuickActions';
import axios from 'axios';
import Link from 'next/link';

export default function DashboardPage() {
    const { address, isConnected } = useAccount();
    const { connect, connectors } = useConnect();
    const [userData, setUserData] = useState<any>(null);
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
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/api/user/${address}`
            );
            setUserData(response.data);
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
                    {userData?.user?.subscription?.isActive && (
                        <div className="glass-dark rounded-2xl p-4 border-l-4 border-green-500 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                                <div>
                                    <p className="text-foreground font-semibold">Active Subscription</p>
                                    <p className="text-muted text-sm font-medium">
                                        ${userData.user.subscription.dailyAmount} USDC deposited daily
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
                        <YieldStats yieldData={userData?.yield} />

                        {/* Yield Chart Placeholder */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="glass-dark rounded-3xl p-6 border border-foreground/5 shadow-sm"
                        >
                            <h2 className="text-2xl font-bold text-foreground mb-4">Yield Performance</h2>
                            <div className="h-64 flex items-center justify-center border-2 border-dashed border-foreground/5 rounded-2xl bg-black/5 dark:bg-white/5">
                                <p className="text-muted/60 font-medium italic">Chart coming soon...</p>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column - Activity */}
                    <div className="space-y-6">
                        <ActivityFeed address={address!} />

                        {/* Info Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="glass-dark rounded-3xl p-6 border border-foreground/5 shadow-sm"
                        >
                            <h3 className="text-lg font-semibold text-foreground mb-4">💡 Did You Know?</h3>
                            <div className="space-y-3 text-sm text-muted font-medium">
                                <p>• Your funds are earning yield 24/7 in AvantisFi</p>
                                <p>• You can withdraw anytime without penalties</p>
                                <p>• All deductions are automated and gas-free</p>
                                <p>• Your keys, your crypto - always non-custodial</p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
