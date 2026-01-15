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
    const [showConfetti, setShowConfetti] = useState(false);

    const handleShare = async () => {
        setIsSharing(true);

        const data: SummaryData = {
            totalSaved: period === 'daily' ? dailyAmount : totalDeposited,
            yieldEarned: yieldEarned,
            currentStreak: currentStreak,
            period: period,
        };

        await shareSummary(data);

        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2000);
        setIsSharing(false);
    };

    // Calculate display values
    const savedAmount = period === 'daily' ? dailyAmount : totalDeposited;
    const periodLabel = period === 'daily' ? "Today's" : "This Week's";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-dark rounded-3xl p-6 border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-blue-500/5 relative overflow-hidden"
        >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />

            {/* Confetti animation */}
            <AnimatePresence>
                {showConfetti && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 pointer-events-none z-20"
                    >
                        {[...Array(12)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{
                                    x: '50%',
                                    y: '50%',
                                    scale: 0
                                }}
                                animate={{
                                    x: `${Math.random() * 100}%`,
                                    y: `${Math.random() * 100}%`,
                                    scale: [0, 1, 0],
                                    rotate: Math.random() * 360
                                }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                className="absolute text-2xl"
                            >
                                {['✨', '🎉', '🚀', '💰', '🔥'][i % 5]}
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative z-10">
                {/* Header with period toggle */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <span className="text-3xl">📊</span>
                        <h3 className="text-xl font-bold text-foreground">Summary Card</h3>
                    </div>

                    {/* Period Toggle */}
                    <div className="flex bg-foreground/5 rounded-xl p-1 border border-foreground/10">
                        <button
                            onClick={() => setPeriod('daily')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${period === 'daily'
                                    ? 'bg-purple-500 text-white shadow-md'
                                    : 'text-muted hover:text-foreground'
                                }`}
                        >
                            Daily
                        </button>
                        <button
                            onClick={() => setPeriod('weekly')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${period === 'weekly'
                                    ? 'bg-purple-500 text-white shadow-md'
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
                        className="glass rounded-2xl p-4 text-center border border-blue-500/10 bg-blue-500/5"
                    >
                        <div className="text-2xl mb-1">💵</div>
                        <div className="text-xl font-bold text-blue-500 font-display">
                            ${savedAmount}
                        </div>
                        <div className="text-xs text-muted font-medium">Saved</div>
                    </motion.div>

                    {/* Yield Earned */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="glass rounded-2xl p-4 text-center border border-green-500/10 bg-green-500/5"
                    >
                        <div className="text-2xl mb-1">✨</div>
                        <div className="text-xl font-bold text-green-500 font-display">
                            ${yieldEarned}
                        </div>
                        <div className="text-xs text-muted font-medium">Yield</div>
                    </motion.div>

                    {/* Current Streak */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="glass rounded-2xl p-4 text-center border border-orange-500/10 bg-orange-500/5"
                    >
                        <div className="text-2xl mb-1">🔥</div>
                        <div className="text-xl font-bold text-orange-500 font-display">
                            {currentStreak}
                        </div>
                        <div className="text-xs text-muted font-medium">Streak</div>
                    </motion.div>
                </div>

                {/* Current Value Banner */}
                <div className="glass rounded-2xl p-4 mb-5 border border-purple-500/10 bg-purple-500/5 text-center">
                    <p className="text-xs text-muted font-medium mb-1">Current Portfolio Value</p>
                    <p className="text-2xl font-bold text-purple-500 font-display">${currentValue}</p>
                </div>

                {/* Share Button */}
                <motion.button
                    onClick={handleShare}
                    disabled={isSharing}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold transition-all disabled:opacity-50 shadow-lg shadow-purple-500/20 flex items-center justify-center gap-3"
                >
                    {isSharing ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Sharing...
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H8l4-7v4h3l-4 7z" />
                            </svg>
                            Share {periodLabel} Summary
                            <span className="text-lg">🚀</span>
                        </>
                    )}
                </motion.button>

                {/* Footer */}
                <p className="text-center text-xs text-muted mt-3 font-medium">
                    One-tap share to Farcaster • Free distribution 💜
                </p>
            </div>
        </motion.div>
    );
}
