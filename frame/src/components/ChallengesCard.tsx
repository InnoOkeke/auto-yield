'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Target, CheckCircle, ArrowRight, Plus } from 'lucide-react';
import axios from 'axios';

interface Participant {
    userId: string;
    username: string;
    contributedAmount: number;
    joinedAt: number;
    status: string;
}

interface Challenge {
    _id: string;
    name: string;
    description?: string;
    targetAmount: number;
    currentAmount: number;
    status: string;
    participants: Participant[];
    userContribution?: number;
}

interface ChallengesCardProps {
    userId: string;
    address: string;
}

export default function ChallengesCard({ userId, address }: ChallengesCardProps) {
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchChallenges = async () => {
            try {
                const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/challenges/user/${userId}`);
                setChallenges(response.data);
            } catch (error) {
                console.error('Failed to fetch challenges:', error);
            } finally {
                setLoading(false);
            }
        };

        if (userId) fetchChallenges();
    }, [userId]);

    if (loading) return (
        <div className="glass-dark rounded-3xl p-6 border border-foreground/10 h-48 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-foreground/10 border-t-primary rounded-full animate-spin" />
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-dark rounded-3xl p-6 border border-foreground/10 relative overflow-hidden h-full"
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Users className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">Challenges</h3>
                </div>
                <button className="p-2 rounded-xl bg-foreground/5 hover:bg-foreground/10 transition-all text-primary">
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            <div className="space-y-4">
                {challenges.length === 0 ? (
                    <div className="text-center py-8 bg-foreground/5 rounded-2xl border border-dashed border-foreground/10">
                        <p className="text-muted text-sm mb-4">No active challenges</p>
                        <button className="text-xs font-bold text-primary hover:underline">
                            Start a challenge with friends
                        </button>
                    </div>
                ) : (
                    challenges.map((challenge) => (
                        <div key={challenge._id} className="bg-foreground/5 rounded-2xl p-4 border border-foreground/5">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="font-bold text-foreground text-sm">{challenge.name}</h4>
                                    <p className="text-xs text-muted line-clamp-1">{challenge.description}</p>
                                </div>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${challenge.status === 'ACTIVE' ? 'bg-primary/20 text-primary' : 'bg-green-500/20 text-green-500'
                                    }`}>
                                    {challenge.status}
                                </span>
                            </div>

                            <div className="mb-3">
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted mb-1">
                                    <span>Progress</span>
                                    <span>${challenge.currentAmount} / ${challenge.targetAmount}</span>
                                </div>
                                <div className="h-1.5 w-full bg-foreground/10 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min((challenge.currentAmount / challenge.targetAmount) * 100, 100)}%` }}
                                        className="h-full bg-primary"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex -space-x-2">
                                    {challenge.participants.slice(0, 3).map((p, i) => (
                                        <div key={i} className="w-6 h-6 rounded-full bg-secondary-200 border-2 border-background flex items-center justify-center overflow-hidden">
                                            <span className="text-[8px] font-bold uppercase">{p.username.slice(0, 2)}</span>
                                        </div>
                                    ))}
                                    {challenge.participants.length > 3 && (
                                        <div className="w-6 h-6 rounded-full bg-foreground/10 border-2 border-background flex items-center justify-center">
                                            <span className="text-[8px] font-bold">+{challenge.participants.length - 3}</span>
                                        </div>
                                    )}
                                </div>
                                <button className="text-xs font-bold text-primary flex items-center gap-1 hover:gap-2 transition-all">
                                    View <ArrowRight className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </motion.div>
    );
}
