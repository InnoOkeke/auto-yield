import { motion } from 'framer-motion';
import { shareStreak } from '@/lib/farcaster';

interface StreakCardProps {
    currentStreak: number;
    bestStreak: number;
}

export default function StreakCard({ currentStreak = 0, bestStreak = 0 }: StreakCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-dark rounded-3xl p-6 border border-orange-500/20 bg-orange-500/5 relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl" />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <span className="text-2xl">🔥</span> Savings Streak
                        </h3>
                        <p className="text-muted text-sm font-medium mt-1">
                            Keep your auto-save active!
                        </p>
                    </div>
                </div>

                <div className="flex items-end gap-2 mb-6">
                    <span className="text-5xl font-bold text-orange-500 font-display">
                        {currentStreak}
                    </span>
                    <span className="text-lg text-foreground/60 font-medium mb-1">days</span>
                </div>

                <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-muted bg-black/10 dark:bg-white/5 py-1.5 px-3 rounded-lg border border-foreground/5">
                        🏆 Best: <span className="text-orange-400">{bestStreak} days</span>
                    </div>

                    <button
                        onClick={() => shareStreak(currentStreak)}
                        className="text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 py-2 px-4 rounded-xl transition-all shadow-md hover:shadow-orange-500/20 flex items-center gap-1.5"
                    >
                        <span>Share</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
