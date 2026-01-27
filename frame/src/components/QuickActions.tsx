'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import SwapModal from './SwapModal';

export default function QuickActions() {
    const [showMenu, setShowMenu] = useState(false);
    const [showSwapModal, setShowSwapModal] = useState(false);

    const actions = [
        { label: 'Smart Swap', action: 'swap', color: 'bg-primary-600' },
        { label: 'Withdraw Funds', href: '/withdraw', color: 'bg-primary-600' },
        { label: 'Adjust Amount', href: '/settings', color: 'bg-secondary-600' },
        { label: 'Pause Subscription', href: '/pause', color: 'bg-secondary-600' },
        { label: 'View History', href: '/history', color: 'bg-secondary-600' },
    ];

    const handleActionClick = (action: typeof actions[0]) => {
        if (action.action === 'swap') {
            setShowSwapModal(true);
            setShowMenu(false);
        }
    };

    return (
        <div className="flex items-center gap-3">
            {/* Primary Smart Swap Button */}
            <button
                onClick={() => setShowSwapModal(true)}
                className="px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-all shadow-md flex items-center gap-2"
            >
                <span>Smart Swap</span>
            </button>

            {/* Quick Actions Dropdown */}
            <div className="relative">
                <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="px-6 py-3 rounded-xl bg-secondary-100 dark:bg-secondary-800 hover:bg-secondary-200 dark:hover:bg-secondary-700 text-foreground font-semibold transition-all border border-foreground/5"
                >
                    Actions
                </button>

                <AnimatePresence>
                    {showMenu && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-40"
                                onClick={() => setShowMenu(false)}
                            />
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute right-0 mt-2 w-64 glass-dark rounded-2xl p-2 shadow-2xl z-50"
                            >
                                {actions.map((action, index) => (
                                    // Skip Smart Swap in menu since it's now a primary button
                                    action.action === 'swap' ? null : (
                                        action.href ? (
                                            <Link
                                                key={index}
                                                href={action.href}
                                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-all group"
                                            >
                                                <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center text-xl shadow-sm text-white`}>
                                                </div>
                                                <span className="text-foreground font-medium">{action.label}</span>
                                            </Link>
                                        ) : (
                                            <button
                                                key={index}
                                                onClick={() => handleActionClick(action)}
                                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-all group"
                                            >
                                                <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center text-xl shadow-sm text-white`}>
                                                </div>
                                                <span className="text-foreground font-medium">{action.label}</span>
                                            </button>
                                        )
                                    )
                                ))}
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>

            {/* Swap Modal */}
            <SwapModal
                isOpen={showSwapModal}
                onClose={() => setShowSwapModal(false)}
            />
        </div >
    );
}

