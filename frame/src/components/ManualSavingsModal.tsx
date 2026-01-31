'use client';

import { useState } from 'react';
import Modal from './Modal';
import { ArrowUpRight, ArrowDownRight, Wallet, Loader2, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { useAccount } from 'wagmi';

interface ManualSavingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    onSuccess: () => void;
    initialMode: 'deposit' | 'withdraw';
}

export default function ManualSavingsModal({ isOpen, onClose, userId, onSuccess, initialMode }: ManualSavingsModalProps) {
    const { address } = useAccount();
    const [mode, setMode] = useState<'deposit' | 'withdraw'>(initialMode);
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'input' | 'submitting' | 'success'>('input');

    const handleAction = async () => {
        if (!amount || parseFloat(amount) <= 0) return;
        setLoading(true);
        setStep('submitting');

        try {
            const endpoint = mode === 'deposit' ? 'deposit' : 'withdraw';
            const mockTxHash = `0x${Math.random().toString(16).slice(2, 66)}`;

            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/savings/${endpoint}`, {
                userId,
                amount: parseFloat(amount),
                txHash: mockTxHash,
                blockNumber: 0,
            });

            setStep('success');
            onSuccess();
        } catch (error) {
            console.error(`${mode} failed:`, error);
            alert(`Failed to record ${mode}. Please try again.`);
            setStep('input');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={mode === 'deposit' ? 'Manual Deposit' : 'Manual Withdrawal'}>
            {step === 'input' && (
                <div className="space-y-6">
                    {/* Mode Toggle */}
                    <div className="flex bg-foreground/5 p-1 rounded-2xl border border-foreground/5">
                        <button
                            onClick={() => setMode('deposit')}
                            className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${mode === 'deposit' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted hover:text-foreground'
                                }`}
                        >
                            <ArrowUpRight className="w-4 h-4" />
                            Deposit
                        </button>
                        <button
                            onClick={() => setMode('withdraw')}
                            className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${mode === 'withdraw' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted hover:text-foreground'
                                }`}
                        >
                            <ArrowDownRight className="w-4 h-4" />
                            Withdraw
                        </button>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-muted">Amount (USDC)</label>
                        <div className="relative">
                            <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                            <input
                                required
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-foreground/5 border border-foreground/10 focus:border-primary focus:outline-none transition-all text-foreground"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleAction}
                        disabled={loading || !amount}
                        className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all shadow-xl shadow-primary/20"
                    >
                        {mode === 'deposit' ? 'Deposit Funds' : 'Withdraw Funds'}
                    </button>
                </div>
            )}

            {step === 'submitting' && (
                <div className="text-center py-12">
                    <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-foreground">Processing {mode === 'deposit' ? 'Deposit' : 'Withdrawal'}</h3>
                    <p className="text-sm text-muted mt-2">Recording transaction on the blockchain...</p>
                </div>
            )}

            {step === 'success' && (
                <div className="text-center py-12">
                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-foreground">Success!</h3>
                    <p className="text-sm text-muted mt-2 mb-8">
                        Your manual {mode} of ${parseFloat(amount).toFixed(2)} USDC has been recorded.
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-foreground/5 text-foreground rounded-2xl font-bold hover:bg-foreground/10 transition-all"
                    >
                        Close
                    </button>
                </div>
            )}
        </Modal>
    );
}
