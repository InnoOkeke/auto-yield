'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import SwapModal from './SwapModal';

export default function QuickActions() {
    const [showMenu, setShowMenu] = useState(false);
    const [showSwapModal, setShowSwapModal] = useState(false);

    const actions = [
        { label: 'Smart Swap', icon: '🔄', action: 'swap', color: 'from-indigo-500 to-violet-500' },
        { label: 'Withdraw Funds', icon: '💰', href: '/withdraw', color: 'from-green-500 to-emerald-500' },
        { label: 'Adjust Amount', icon: '⚙️', href: '/settings', color: 'from-blue-500 to-cyan-500' },
        { label: 'Pause Subscription', icon: '⏸️', href: '/pause', color: 'from-yellow-500 to-orange-500' },
        { label: 'View History', icon: '📊', href: '/history', color: 'from-purple-500 to-pink-500' },
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
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-semibold transition-all shadow-lg flex items-center gap-2"
            >
                <span>🔄</span>
                <span>Smart Swap</span>
            </button>

            {/* Quick Actions Dropdown */}
            <div className="relative">
                <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-all backdrop-blur-md"
                >
                    Actions ⚡
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
                                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-all"
                                            >
                                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${action.color} flex items-center justify-center text-xl`}>
                                                    {action.icon}
                                                </div>
                                                <span className="text-white font-medium">{action.label}</span>
                                            </Link>
                                        ) : (
                                            <button
                                                key={index}
                                                onClick={() => handleActionClick(action)}
                                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-all"
                                            >
                                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${action.color} flex items-center justify-center text-xl`}>
                                                    {action.icon}
                                                </div>
                                                <span className="text-white font-medium">{action.label}</span>
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
        </div>
    );
}

