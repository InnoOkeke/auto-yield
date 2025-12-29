'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import YieldStats from '@/components/YieldStats';
import ActivityFeed from '@/components/ActivityFeed';
import QuickActions from '@/components/QuickActions';
import axios from 'axios';

export default function DashboardPage() {
    const { address, isConnected } = useAccount();
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isConnected && address) {
            fetchUserData();
        }
    }, [isConnected, address]);

    const fetchUserData = async () => {
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
    };

    if (!isConnected) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-accent-900 flex items-center justify-center p-4">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white mb-4">Connect Your Wallet</h1>
                    <p className="text-white/70 mb-8">Please connect your wallet to view your dashboard</p>
                    <a
                        href="/onboard"
                        className="inline-block px-8 py-4 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl text-white font-semibold hover:scale-105 transition-transform"
                    >
                        Connect Wallet
                    </a>
                </div>
            </main>
        );
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-accent-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-white/70">Loading your dashboard...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-accent-900 p-4 md:p-8">
            <div className="container mx-auto max-w-7xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                                Your AutoYield Dashboard
                            </h1>
                            <p className="text-white/60">
                                {address?.slice(0, 6)}...{address?.slice(-4)}
                            </p>
                        </div>
                        <QuickActions />
                    </div>

                    {/* Subscription Status Banner */}
                    {userData?.user?.subscription?.isActive && (
                        <div className="glass-dark rounded-2xl p-4 border-l-4 border-green-400">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                                <div>
                                    <p className="text-white font-semibold">Active Subscription</p>
                                    <p className="text-white/60 text-sm">
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
                            className="glass-dark rounded-3xl p-6"
                        >
                            <h2 className="text-2xl font-bold text-white mb-4">Yield Performance</h2>
                            <div className="h-64 flex items-center justify-center">
                                <p className="text-white/40">Chart coming soon...</p>
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
                            className="glass-dark rounded-3xl p-6"
                        >
                            <h3 className="text-lg font-semibold text-white mb-4">💡 Did You Know?</h3>
                            <div className="space-y-3 text-sm text-white/70">
                                <p>• Your funds are earning yield 24/7 in AvantisFi</p>
                                <p>• You can withdraw anytime without penalties</p>
                                <p>• All deductions are automated and gas-free</p>
                                <p>• Your keys, your crypto - always non-custodial</p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </main>
    );
}
