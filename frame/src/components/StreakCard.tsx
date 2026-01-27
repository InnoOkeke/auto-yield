import { motion } from 'framer-motion';
import { shareStreak } from '@/lib/farcaster';
import { Flame, Share2 } from 'lucide-react';

interface StreakCardProps {
    currentStreak: number;
    bestStreak: number;
}

export default function StreakCard({ currentStreak = 0, bestStreak = 0 }: StreakCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-dark rounded-3xl p-6 border border-primary-500/20 bg-primary-500/5 relative overflow-hidden group"
        >
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-primary-500/10 rounded-full blur-2xl group-hover:bg-primary-500/20 transition-all" />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 mb-1">
                            <Flame className="w-5 h-5 fill-current" />
                            <h3 className="text-sm font-bold uppercase tracking-widest">Savings Streak</h3>
                        </div>
                        <p className="text-secondary-500 dark:text-secondary-400 text-xs font-medium">
                            Auto-save is building your future
                        </p>
                    </div>
                </div>

                <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-6xl font-black text-primary-600 dark:text-primary-400 font-display transition-transform group-hover:scale-110 duration-500 origin-left">
                        {currentStreak}
                    </span>
                    <span className="text-sm text-secondary-500 dark:text-secondary-400 font-bold uppercase tracking-wider">Days</span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-foreground/5">
                    <div className="text-[10px] font-bold text-secondary-500 dark:text-secondary-400 uppercase tracking-widest">
                        Best <span className="text-primary-600 dark:text-primary-400 ml-1">{bestStreak} Days</span>
                    </div>

                    <button
                        onClick={() => shareStreak(currentStreak)}
                        className="p-2.5 rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition-all shadow-md flex items-center gap-2 text-xs font-bold"
                    >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share</span>
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
