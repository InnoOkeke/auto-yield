'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { ArrowDownRight, ArrowUpRight, Gift, FileText, ChevronRight } from 'lucide-react';

export default function ActivityFeed({ address }: { address: string }) {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTransactions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [address]);

    const fetchTransactions = async () => {
        try {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/api/transactions/${address}?limit=10`
            );
            setTransactions(response.data.transactions);
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'DEDUCTION':
                return <ArrowDownRight className="w-5 h-5" />;
            case 'WITHDRAWAL':
                return <ArrowUpRight className="w-5 h-5" />;
            case 'REWARDS_CLAIM':
                return <Gift className="w-5 h-5" />;
            default:
                return <FileText className="w-5 h-5" />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'DEDUCTION':
                return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
            case 'WITHDRAWAL':
                return 'bg-green-500/10 text-green-600 dark:text-green-400';
            case 'REWARDS_CLAIM':
                return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
            default:
                return 'bg-secondary-500/10 text-secondary-600 dark:text-secondary-400';
        }
    };

    const formatType = (type: string) => {
        return type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-dark rounded-3xl p-6 border border-foreground/5 shadow-sm"
        >
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-xl font-black text-foreground uppercase tracking-widest">History</h2>
                    <p className="text-secondary-500 text-[10px] font-bold uppercase tracking-widest mt-1">Real-time Activity</p>
                </div>
                <button className="text-primary-600 dark:text-primary-400 hover:opacity-80 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border border-primary-600/20">
                    View All
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="w-10 h-10 border-4 border-foreground/5 border-t-primary-500 rounded-full animate-spin mx-auto" />
                </div>
            ) : transactions.length === 0 ? (
                <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-secondary-500/5 flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-secondary-500/30" />
                    </div>
                    <p className="text-secondary-400 font-bold uppercase tracking-widest text-xs">No activity yet</p>
                    <p className="text-secondary-500/60 text-[10px] mt-1 font-medium italic">Start saving to build history</p>
                </div>
            ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {transactions.map((tx, index) => (
                        <motion.div
                            key={tx.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="group flex items-center justify-between p-3 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-foreground/5"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${getTypeColor(tx.type)}`}>
                                    {getTypeIcon(tx.type)}
                                </div>
                                <div>
                                    <p className="text-foreground font-bold text-sm tracking-tight">
                                        {formatType(tx.type)}
                                    </p>
                                    <p className="text-secondary-500 text-[10px] font-bold uppercase tracking-wider">
                                        {new Date(tx.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right flex items-center gap-3">
                                <div>
                                    <p className="text-foreground font-black text-sm">
                                        ${parseFloat(tx.amount).toFixed(2)}
                                    </p>
                                    <a
                                        href={`https://basescan.org/tx/${tx.txHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary-600 dark:text-primary-400 hover:underline text-[9px] font-bold uppercase tracking-widest block"
                                    >
                                        Basescan
                                    </a>
                                </div>
                                <ChevronRight className="w-4 h-4 text-secondary-500/30 group-hover:text-primary-500 transition-colors" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </motion.div>
    );
}
