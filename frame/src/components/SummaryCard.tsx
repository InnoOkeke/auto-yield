'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { shareSummary, SummaryData } from '@/lib/farcaster';

interface SummaryCardProps {
    totalDeposited: string;
    yieldEarned: string;
    currentStreak: number;
    dailyAmount: string;
    currentValue: string;
}

export default function SummaryCard({
    totalDeposited,
    yieldEarned,
    currentStreak,
    dailyAmount,
    currentValue,
}: SummaryCardProps) {
    const [period, setPeriod] = useState<'daily' | 'weekly'>('daily');
    const [isSharing, setIsSharing] = useState(false);

    const handleShare = async () => {
        setIsSharing(true);

        const data: SummaryData = {
            totalSaved: period === 'daily' ? dailyAmount : totalDeposited,
            yieldEarned: yieldEarned,
            currentStreak: currentStreak,
            period: period,
        };

        await shareSummary(data);
        setIsSharing(false);
    };

    // Calculate display values
    const savedAmount = period === 'daily' ? dailyAmount : totalDeposited;
    const periodLabel = period === 'daily' ? "Today's" : "This Week's";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-dark rounded-3xl p-6 border border-foreground/10 relative overflow-hidden"
        >


            <div className="relative z-10">
                {/* Header with period toggle */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-foreground">Summary Card</h3>
                    </div>

                    {/* Period Toggle */}
                    <div className="flex bg-foreground/5 rounded-xl p-1 border border-foreground/10">
                        <button
                            onClick={() => setPeriod('daily')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${period === 'daily'
                                ? 'bg-primary text-white shadow-md'
                                : 'text-muted hover:text-foreground'
                                }`}
                        >
                            Daily
                        </button>
                        <button
                            onClick={() => setPeriod('weekly')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${period === 'weekly'
                                ? 'bg-primary text-white shadow-md'
                                : 'text-muted hover:text-foreground'
                                }`}
                        >
                            Weekly
                        </button>
                    </div>
                </div>

                {/* Summary Stats Grid */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                    {/* Amount Saved */}
                    <motion.div
                        key={`saved-${period}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-secondary-50 dark:bg-secondary-900/40 rounded-2xl p-4 text-center border border-foreground/5"
                    >
                        <div className="text-xl font-bold text-primary dark:text-primary-400 font-display">
                            ${savedAmount}
                        </div>
                        <div className="text-xs text-muted uppercase tracking-wider font-semibold">Saved</div>
                    </motion.div>

                    {/* Yield Earned */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="bg-secondary-50 dark:bg-secondary-900/40 rounded-2xl p-4 text-center border border-foreground/5"
                    >
                        <div className="text-xl font-bold text-primary dark:text-primary-400 font-display">
                            ${yieldEarned}
                        </div>
                        <div className="text-xs text-muted uppercase tracking-wider font-semibold">Yield</div>
                    </motion.div>

                    {/* Current Streak */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-secondary-50 dark:bg-secondary-900/40 rounded-2xl p-4 text-center border border-foreground/5"
                    >
                        <div className="text-xl font-bold text-primary dark:text-primary-400 font-display">
                            {currentStreak}
                        </div>
                        <div className="text-xs text-muted uppercase tracking-wider font-semibold">Streak</div>
                    </motion.div>
                </div>

                {/* Current Value Banner */}
                <div className="bg-primary-50 dark:bg-primary-900/20 rounded-2xl p-4 mb-5 border border-primary-100 dark:border-primary-800 text-center">
                    <p className="text-xs text-primary-700 dark:text-primary-300 font-semibold uppercase tracking-wider mb-1">Current Portfolio Value</p>
                    <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 font-display">${currentValue}</p>
                </div>

                {/* Footer with Share Button */}
                <div className="flex items-center justify-between">
                    <p className="text-xs text-muted font-medium">
                        One-tap share
                    </p>
                    <button
                        onClick={handleShare}
                        disabled={isSharing}
                        className="text-xs font-bold text-white bg-primary hover:opacity-90 py-2 px-4 rounded-xl transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
                    >
                        {isSharing ? (
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>Share</span>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
