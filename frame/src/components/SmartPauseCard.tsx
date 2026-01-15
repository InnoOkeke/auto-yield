'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

interface SmartPauseCardProps {
    pauseData: {
        isPaused: boolean;
        pauseReason: string | null;
        pausedAt: string | null;
        currentStreak: number;
        bestStreak: number;
        dailyAmount: string;
        currentBalance: string | null;
        requiredAmount: string | null;
    };
    address: string;
    onResume?: () => void;
}

export default function SmartPauseCard({ pauseData, address, onResume }: SmartPauseCardProps) {
    const [isResuming, setIsResuming] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleResume = async () => {
        setIsResuming(true);
        setError(null);

        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/subscription/resume`,
                { address }
            );

            if (response.data.success) {
                onResume?.();
            } else {
                setError(response.data.error || 'Failed to resume');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to resume subscription');
        } finally {
            setIsResuming(false);
        }
    };

    const currentBalance = parseFloat(pauseData.currentBalance || '0');
    const requiredAmount = parseFloat(pauseData.requiredAmount || '0');
    const canResume = currentBalance >= requiredAmount;
    const pausedDate = pauseData.pausedAt ? new Date(pauseData.pausedAt) : null;
    const daysPaused = pausedDate
        ? Math.floor((Date.now() - pausedDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-dark rounded-3xl p-6 border border-amber-500/30 bg-amber-500/5 relative overflow-hidden"
        >
            {/* Decorative glow */}
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 bg-amber-400/10 rounded-full blur-2xl" />

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <span className="text-4xl">💤</span>
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full"
                            />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-foreground">Daily Save Paused</h3>
                            <p className="text-amber-500/80 text-sm font-medium">
                                Your streak is safe • {pauseData.currentStreak} days
                            </p>
                        </div>
                    </div>
                </div>

                {/* Friendly Message */}
                <div className="glass rounded-2xl p-4 mb-5 border border-amber-500/10 bg-amber-500/5">
                    <p className="text-foreground/90 font-medium text-sm leading-relaxed">
                        We paused your daily save so you don&apos;t overdraft. {' '}
                        <span className="text-amber-500">Your wallet was running low</span>, but don&apos;t worry –
                        we&apos;ve got your back! Fund your wallet to resume.
                    </p>
                </div>

                {/* Balance Info */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="glass rounded-xl p-3 border border-foreground/5">
                        <p className="text-muted text-xs font-medium mb-1">Current Balance</p>
                        <p className={`text-lg font-bold ${canResume ? 'text-green-500' : 'text-amber-500'}`}>
                            ${currentBalance.toFixed(2)}
                        </p>
                    </div>
                    <div className="glass rounded-xl p-3 border border-foreground/5">
                        <p className="text-muted text-xs font-medium mb-1">Required</p>
                        <p className="text-lg font-bold text-foreground">
                            ${requiredAmount.toFixed(2)}
                        </p>
                    </div>
                </div>

                {/* Progress bar showing how close they are */}
                <div className="mb-5">
                    <div className="flex justify-between text-xs text-muted font-medium mb-1">
                        <span>Progress to resume</span>
                        <span>{Math.min(100, Math.round((currentBalance / requiredAmount) * 100))}%</span>
                    </div>
                    <div className="h-2 bg-foreground/10 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (currentBalance / requiredAmount) * 100)}%` }}
                            transition={{ duration: 0.5 }}
                            className={`h-full rounded-full ${canResume ? 'bg-green-500' : 'bg-amber-500'}`}
                        />
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                        <p className="text-red-400 text-sm font-medium">{error}</p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    {canResume ? (
                        <button
                            onClick={handleResume}
                            disabled={isResuming}
                            className="flex-1 py-3.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold transition-all disabled:opacity-50 shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
                        >
                            {isResuming ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Resuming...
                                </>
                            ) : (
                                <>
                                    <span>▶️</span>
                                    Resume Daily Saves
                                </>
                            )}
                        </button>
                    ) : (
                        <a
                            href="/withdraw" // Link to swap/deposit page
                            className="flex-1 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-all text-center shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                        >
                            <span>💰</span>
                            Add Funds to Resume
                        </a>
                    )}
                </div>

                {/* Footer info */}
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted font-medium">
                    <span>⏱️</span>
                    <span>
                        {daysPaused === 0 ? 'Paused today' : `Paused ${daysPaused} day${daysPaused > 1 ? 's' : ''} ago`}
                    </span>
                    <span className="text-foreground/20">•</span>
                    <span>Auto-resume enabled</span>
                </div>
            </div>
        </motion.div>
    );
}
