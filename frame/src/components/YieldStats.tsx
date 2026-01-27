'use client';

import { motion } from 'framer-motion';
import { Wallet, DollarSign, TrendingUp, Target } from 'lucide-react';

export default function YieldStats({ yieldData }: { yieldData: any }) {
    const stats = [
        {
            label: 'Total Deposited',
            value: `$${yieldData?.totalDeposited || '0.00'}`,
            icon: Wallet,
        },
        {
            label: 'Current Value',
            value: `$${yieldData?.currentValue || '0.00'}`,
            icon: DollarSign,
        },
        {
            label: 'Yield Earned',
            value: `$${yieldData?.yieldEarned || '0.00'}`,
            icon: TrendingUp,
        },
        {
            label: 'Yield %',
            value: `${yieldData?.yieldPercentage || '0.00'}%`,
            icon: Target,
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
            {stats.map((stat, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="glass-dark rounded-2xl p-6 border border-foreground/5 shadow-sm hover:border-primary-500/30 transition-all group"
                >
                    <div className="w-12 h-12 rounded-xl bg-primary-600/10 flex items-center justify-center mb-4 group-hover:bg-primary-600/20 transition-colors">
                        <stat.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-1 font-display">
                        {stat.value}
                    </div>
                    <div className="text-secondary-500 dark:text-secondary-400 text-xs font-bold uppercase tracking-wider">{stat.label}</div>
                </motion.div>
            ))}
        </motion.div>
    );
}
