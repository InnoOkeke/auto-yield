'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

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
                return '💸';
            case 'WITHDRAWAL':
                return '💰';
            case 'REWARDS_CLAIM':
                return '🎁';
            default:
                return '📝';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'DEDUCTION':
                return 'text-blue-400';
            case 'WITHDRAWAL':
                return 'text-green-400';
            case 'REWARDS_CLAIM':
                return 'text-purple-400';
            default:
                return 'text-white';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-dark rounded-3xl p-6 backdrop-blur-xl"
        >
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Activity</h2>
                <button className="text-primary-400 hover:text-primary-300 text-sm font-medium">
                    View All
                </button>
            </div>

            {loading ? (
                <div className="text-center py-8">
                    <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
                </div>
            ) : transactions.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-white/40">No transactions yet</p>
                    <p className="text-white/30 text-sm mt-2">Start saving to see your activity</p>
                </div>
            ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {transactions.map((tx, index) => (
                        <motion.div
                            key={tx.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="glass rounded-xl p-4 hover:bg-white/10 transition-all"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{getTypeIcon(tx.type)}</span>
                                    <div>
                                        <p className={`font-semibold ${getTypeColor(tx.type)}`}>
                                            {tx.type.replace('_', ' ')}
                                        </p>
                                        <p className="text-white/40 text-xs">
                                            {new Date(tx.timestamp).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-white font-semibold">
                                        ${parseFloat(tx.amount).toFixed(2)}
                                    </p>
                                    <a
                                        href={`https://basescan.org/tx/${tx.txHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary-400 hover:text-primary-300 text-xs"
                                    >
                                        View →
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </motion.div>
    );
}
