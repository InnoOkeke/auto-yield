'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, ArrowRight, Plus, Wallet } from 'lucide-react';
import axios from 'axios';
import CreateChallengeModal from './CreateChallengeModal';
import ContributeModal from './ContributeModal';

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
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

    const fetchChallenges = useCallback(async () => {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/challenges/user/${userId}`);
            setChallenges(response.data);
        } catch (error) {
            console.error('Failed to fetch challenges:', error);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (userId) fetchChallenges();
    }, [userId, fetchChallenges]);

    if (loading) return (
        <div className="glass-dark rounded-3xl p-6 border border-foreground/10 h-48 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-foreground/10 border-t-primary rounded-full animate-spin" />
        </div>
    );

    return (
        <>
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
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="p-2 rounded-xl bg-foreground/5 hover:bg-foreground/10 transition-all text-primary"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    {challenges.length === 0 ? (
                        <div className="text-center py-8 bg-foreground/5 rounded-2xl border border-dashed border-foreground/10">
                            <p className="text-muted text-sm mb-4">No active challenges</p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="text-xs font-bold text-primary hover:underline"
                            >
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
                                        <span>${challenge.currentAmount.toFixed(2)} / ${challenge.targetAmount.toFixed(2)}</span>
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
                                            <div key={i} title={p.username} className="w-6 h-6 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center overflow-hidden">
                                                <span className="text-[8px] font-bold uppercase text-primary">{p.username.slice(0, 2)}</span>
                                            </div>
                                        ))}
                                        {challenge.participants.length > 3 && (
                                            <div className="w-6 h-6 rounded-full bg-foreground/10 border-2 border-background flex items-center justify-center">
                                                <span className="text-[8px] font-bold">+{challenge.participants.length - 3}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setSelectedChallenge(challenge)}
                                            className="text-xs font-bold text-primary flex items-center gap-1 hover:opacity-80 transition-all border border-primary/20 px-2 py-1 rounded-lg"
                                        >
                                            <Wallet className="w-3 h-3" /> Contribute
                                        </button>
                                        <button className="text-xs font-bold text-muted flex items-center gap-1 hover:text-foreground transition-all">
                                            View <ArrowRight className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </motion.div>

            <CreateChallengeModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                userId={userId}
                onSuccess={fetchChallenges}
            />

            {selectedChallenge && (
                <ContributeModal
                    isOpen={!!selectedChallenge}
                    onClose={() => setSelectedChallenge(null)}
                    userId={userId}
                    challengeId={selectedChallenge._id}
                    challengeName={selectedChallenge.name}
                    onSuccess={fetchChallenges}
                />
            )}
        </>
    );
}
