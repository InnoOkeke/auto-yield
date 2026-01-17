'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { TrendingUp, DollarSign, Users } from 'lucide-react';

interface HeroProps {
    apy?: number;
    totalSaved?: string;
    activeUsers?: number;
}

export default function Hero({
    apy = 9.45,
    totalSaved = '$0',
    activeUsers = 0
}: HeroProps) {
    return (
        <div className="text-center py-12 md:py-20">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
            >
                <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-float">
                    <span className="text-primary-600 dark:text-primary-400">
                        Meluri AutoYield
                    </span>
                </h1>
                <p className="text-xl md:text-2xl text-foreground/80 mb-4 font-medium">
                    Automate Your DeFi Savings
                </p>
                <p className="text-lg text-muted max-w-2xl mx-auto">
                    Save daily, earn automatically. Set it and forget it with automated USDC deductions
                    earning yield on Base through AvantisFi.
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
                <Link
                    href="/onboard"
                    className="px-8 py-4 bg-primary-50 dark:bg-primary-600 text-primary-600 dark:text-white border-2 border-primary-600 dark:border-transparent rounded-xl font-semibold text-lg hover:scale-105 transition-transform animate-pulse-glow shadow-md dark:shadow-2xl"
                >
                    Start Earning Now
                </Link>
                <Link
                    href="/dashboard"
                    className="px-8 py-4 glass-dark rounded-xl text-foreground font-semibold text-lg hover:scale-105 transition-transform border border-foreground/10"
                >
                    View Dashboard
                </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
            >
                {[
                    { label: 'Current APY', value: `~${apy}%`, icon: TrendingUp },
                    { label: 'Total Saved', value: totalSaved, icon: DollarSign },
                    { label: 'Active Users', value: activeUsers > 0 ? activeUsers.toLocaleString() : '0', icon: Users },
                ].map((stat, i) => (
                    <div key={i} className="glass-dark rounded-2xl p-6 backdrop-blur-xl border border-foreground/5 shadow-sm">
                        <div className="flex justify-center mb-3">
                            <stat.icon className="w-8 h-8 text-primary-500" />
                        </div>
                        <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                        <div className="text-muted">{stat.label}</div>
                    </div>
                ))}
            </motion.div>
        </div>
    );
}
