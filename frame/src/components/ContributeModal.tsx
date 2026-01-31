'use client';

import { useState } from 'react';
import Modal from './Modal';
import { Wallet, Loader2, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';

interface ContributeModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    challengeId: string;
    challengeName: string;
    onSuccess: () => void;
}

export default function ContributeModal({ isOpen, onClose, userId, challengeId, challengeName, onSuccess }: ContributeModalProps) {
    const { address } = useAccount();
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'input' | 'submitting' | 'success'>('input');

    const handleContribute = async () => {
        if (!amount || parseFloat(amount) <= 0) return;
        setLoading(true);
        setStep('submitting');

        try {
            // In a real scenario, we would execute a blockchain transaction here.
            // For now, we simulate the transaction and record it on the backend.
            // Mock transaction hash
            const mockTxHash = `0x${Math.random().toString(16).slice(2, 66)}`;

            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/challenges/contribute`, {
                challengeId,
                userId,
                amount: parseFloat(amount),
                txHash: mockTxHash,
                blockNumber: 0,
            });

            setStep('success');
            onSuccess();
        } catch (error) {
            console.error('Contribution failed:', error);
            alert('Failed to record contribution. Please try again.');
            setStep('input');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Contribute to ${challengeName}`}>
            {step === 'input' && (
                <div className="space-y-6">
                    <p className="text-sm text-muted">
                        Enter the amount of USDC you'd like to contribute to this goal.
                    </p>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-muted">Amount (USDC)</label>
                        <div className="relative">
                            <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                            <input
                                required
                                type="number"
                                step="0.01"
                                placeholder="10.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-foreground/5 border border-foreground/10 focus:border-primary focus:outline-none transition-all text-foreground"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleContribute}
                        disabled={loading || !amount}
                        className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all shadow-xl shadow-primary/20"
                    >
                        Contribute Now
                    </button>
                </div>
            )}

            {step === 'submitting' && (
                <div className="text-center py-12">
                    <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-foreground">Processing Contribution</h3>
                    <p className="text-sm text-muted mt-2">Recording your contribution on the blockchain...</p>
                </div>
            )}

            {step === 'success' && (
                <div className="text-center py-12">
                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-foreground">Contribution Recorded!</h3>
                    <p className="text-sm text-muted mt-2 mb-8">
                        You've successfully added ${parseFloat(amount).toFixed(2)} to {challengeName}.
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-foreground/5 text-foreground rounded-2xl font-bold hover:bg-foreground/10 transition-all"
                    >
                        Done
                    </button>
                </div>
            )}
        </Modal>
    );
}
