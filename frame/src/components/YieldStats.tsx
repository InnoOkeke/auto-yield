'use client';

import { motion } from 'framer-motion';

export default function YieldStats({ yieldData }: { yieldData: any }) {
    const stats = [
        {
            label: 'Total Deposited',
            value: `$${yieldData?.totalDeposited || '0.00'}`,
            icon: '💵',
            color: 'text-blue-600 dark:text-blue-400',
        },
        {
            label: 'Current Value',
            value: `$${yieldData?.currentValue || '0.00'}`,
            icon: '💰',
            color: 'text-green-600 dark:text-green-400',
        },
        {
            label: 'Yield Earned',
            value: `$${yieldData?.yieldEarned || '0.00'}`,
            icon: '📈',
            color: 'text-purple-600 dark:text-purple-400',
        },
        {
            label: 'Yield %',
            value: `${yieldData?.yieldPercentage || '0.00'}%`,
            icon: '🎯',
            color: 'text-orange-600 dark:text-orange-400',
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
                    className="glass-dark rounded-2xl p-6 backdrop-blur-xl hover:scale-105 transition-transform border border-foreground/5 shadow-sm"
                >
                    <div className="text-4xl mb-3">{stat.icon}</div>
                    <div className={`text-2xl md:text-3xl font-bold ${stat.color} mb-1`}>
                        {stat.value}
                    </div>
                    <div className="text-muted text-sm font-medium">{stat.label}</div>
                </motion.div>
            ))}
        </motion.div>
    );
}
