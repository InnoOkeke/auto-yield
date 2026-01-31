'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Landmark, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';
import axios from 'axios';

interface ManualSavingsCardProps {
    userId: string;
    address: string;
}

export default function ManualSavingsCard({ userId, address }: ManualSavingsCardProps) {
    const [totalSavings, setTotalSavings] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSavings = async () => {
            try {
                const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/savings/total/${userId}`);
                setTotalSavings(response.data.total);
            } catch (error) {
                console.error('Failed to fetch savings:', error);
            } finally {
                setLoading(false);
            }
        };

        if (userId) fetchSavings();
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
            className="glass-dark rounded-3xl p-6 border border-foreground/10 relative overflow-hidden h-full flex flex-col justify-between"
        >
            <div>
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Landmark className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">Manual Savings</h3>
                </div>

                <div className="mb-8">
                    <p className="text-xs text-muted font-black uppercase tracking-widest mb-1">Total Accumulated</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-foreground font-display">${totalSavings.toFixed(2)}</span>
                        <span className="text-sm font-bold text-primary">USDC</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 py-3 px-4 bg-primary text-white rounded-2xl font-bold text-sm hover:opacity-90 transition-all shadow-lg active:scale-95">
                    <ArrowUpRight className="w-4 h-4" />
                    Deposit
                </button>
                <button className="flex items-center justify-center gap-2 py-3 px-4 bg-foreground/10 text-foreground rounded-2xl font-bold text-sm hover:bg-foreground/20 transition-all active:scale-95">
                    <ArrowDownRight className="w-4 h-4" />
                    Withdraw
                </button>
            </div>

            {/* Decorative background icon */}
            <Wallet className="absolute -bottom-6 -right-6 w-32 h-32 text-foreground/5 -rotate-12" />
        </motion.div>
    );
}
