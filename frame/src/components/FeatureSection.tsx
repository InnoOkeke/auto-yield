'use client';

import { motion } from 'framer-motion';

export default function FeatureSection() {
    const features = [
        {
            icon: '⚡',
            title: 'Automated Savings',
            description: 'Set your daily amount and let our backend handle the rest. Built for efficiency.',
        },
        {
            icon: '🔄',
            title: 'Automated Daily Deductions',
            description: 'Set your daily amount and forget it. Our backend handles everything while you sleep.',
        },
        {
            icon: '📊',
            title: 'Instant Yield Generation',
            description: 'Every deduction is immediately deposited into AvantisFi LP Vault for maximum yield.',
        },
        {
            icon: '🔐',
            title: 'Non-Custodial',
            description: 'You always control your funds. Withdraw anytime with no penalties or lockups.',
        },
        {
            icon: '⚙️',
            title: 'Flexible Management',
            description: 'Adjust your daily amount, pause, or cancel your subscription anytime you want.',
        },
        {
            icon: '🌐',
            title: 'Built on Base',
            description: 'Lightning-fast transactions with minimal fees on Coinbase\'s Layer 2 network.',
        },
    ];

    return (
        <div className="py-16">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-center mb-12"
            >
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    Why Choose AutoYield?
                </h2>
                <p className="text-white/70 text-lg">
                    The easiest way to build wealth through DeFi
                </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="glass-dark rounded-2xl p-6 hover:scale-105 transition-transform cursor-pointer backdrop-blur-xl"
                    >
                        <div className="text-5xl mb-4">{feature.icon}</div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                            {feature.title}
                        </h3>
                        <p className="text-white/70">
                            {feature.description}
                        </p>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
