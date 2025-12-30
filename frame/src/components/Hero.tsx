'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Hero() {
    return (
        <div className="text-center py-12 md:py-20">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
            >
                <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-float">
                    <span className="bg-gradient-to-r from-primary-300 to-accent-300 bg-clip-text text-transparent">
                        Meluri Auto Yield
                    </span>
                </h1>
                <p className="text-xl md:text-2xl text-white/80 mb-4">
                    Automate Your DeFi Savings
                </p>
                <p className="text-lg text-white/60 max-w-2xl mx-auto">
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
                    className="px-8 py-4 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl text-white font-semibold text-lg hover:scale-105 transition-transform animate-pulse-glow shadow-2xl"
                >
                    Start Earning Now 💰
                </Link>
                <Link
                    href="/dashboard"
                    className="px-8 py-4 glass-dark rounded-xl text-white font-semibold text-lg hover:scale-105 transition-transform"
                >
                    View Dashboard 📊
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
                    { label: 'Current APY', value: '~12.5%', icon: '📈' },
                    { label: 'Total Saved', value: '$250K+', icon: '💵' },
                    { label: 'Active Users', value: '500+', icon: '👥' },
                ].map((stat, i) => (
                    <div key={i} className="glass-dark rounded-2xl p-6 backdrop-blur-xl">
                        <div className="text-4xl mb-2">{stat.icon}</div>
                        <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                        <div className="text-white/60">{stat.label}</div>
                    </div>
                ))}
            </motion.div>
        </div>
    );
}
