'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import axios from 'axios';

interface SwapModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface TransactionData {
    to: string;
    data: string;
    value: string;
    gasLimit?: string;
}

interface SwapMetadata {
    prompt: string;
    chain: string;
    estimatedGas?: string;
    route?: any;
}

type SwapState = 'idle' | 'loading' | 'preview' | 'signing' | 'pending' | 'success' | 'error';

export default function SwapModal({ isOpen, onClose }: SwapModalProps) {
    const { address, isConnected } = useAccount();
    const { sendTransaction, data: txHash, isPending: isSending } = useSendTransaction();

    const [prompt, setPrompt] = useState('');
    const [state, setState] = useState<SwapState>('idle');
    const [transaction, setTransaction] = useState<TransactionData | null>(null);
    const [metadata, setMetadata] = useState<SwapMetadata | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Wait for transaction confirmation
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash: txHash,
    });

    // Example prompts for user convenience
    const examplePrompts = [
        'Swap 0.01 ETH to USDC',
        'Convert 100 DEGEN to USDC',
        'Swap 50 HIGHER to USDC',
        'Exchange 0.005 ETH for USDC',
    ];

    const generateSwapTransaction = useCallback(async () => {
        if (!prompt.trim() || !address) return;

        setState('loading');
        setError(null);

        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/bankr/swap`,
                {
                    prompt: prompt.trim(),
                    userAddress: address,
                    chain: 'base'
                }
            );

            if (response.data.success) {
                setTransaction(response.data.transaction);
                setMetadata(response.data.metadata);
                setState('preview');
            } else {
                throw new Error(response.data.message || 'Failed to generate swap');
            }
        } catch (err: any) {
            console.error('Swap generation error:', err);
            setError(err.response?.data?.message || err.message || 'Failed to generate swap transaction');
            setState('error');
        }
    }, [prompt, address]);

    const executeSwap = useCallback(async () => {
        if (!transaction) return;

        setState('signing');

        try {
            sendTransaction({
                to: transaction.to as `0x${string}`,
                data: transaction.data as `0x${string}`,
                value: BigInt(transaction.value || '0'),
            });
            setState('pending');
        } catch (err: any) {
            console.error('Transaction signing error:', err);
            setError('Failed to sign transaction. Please try again.');
            setState('error');
        }
    }, [transaction, sendTransaction]);

    const resetModal = useCallback(() => {
        setPrompt('');
        setState('idle');
        setTransaction(null);
        setMetadata(null);
        setError(null);
    }, []);

    const handleClose = useCallback(() => {
        resetModal();
        onClose();
    }, [resetModal, onClose]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        onClick={handleClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-x-4 top-[15%] max-w-lg mx-auto z-50 max-h-[80vh] overflow-y-auto custom-scrollbar"
                    >
                        <div className="glass-dark rounded-3xl p-6 shadow-2xl border border-white/10">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 flex items-center justify-center text-2xl">
                                        🔄
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Smart Swap</h2>
                                        <p className="text-sm text-white/60">Powered by Bankr AI</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleClose}
                                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Content based on state */}
                            {state === 'idle' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-white/80 mb-2">
                                            What would you like to swap?
                                        </label>
                                        <div className="relative">
                                            <textarea
                                                value={prompt}
                                                onChange={(e) => setPrompt(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        if (prompt.trim()) {
                                                            generateSwapTransaction();
                                                        }
                                                    }
                                                }}
                                                placeholder="e.g., Swap 0.1 ETH to USDC"
                                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-primary-500 resize-none pr-12"
                                                rows={2}
                                                autoFocus
                                            />
                                            <button
                                                onClick={generateSwapTransaction}
                                                disabled={!prompt.trim() || !isConnected}
                                                className="absolute right-2 bottom-2 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all disabled:opacity-0"
                                                title="Press Enter"
                                            >
                                                ↵
                                            </button>
                                        </div>
                                    </div>

                                    {/* Example prompts */}
                                    <div className="flex flex-wrap gap-2">
                                        {examplePrompts.map((example, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setPrompt(example)}
                                                className="px-3 py-1.5 rounded-full bg-white/5 text-xs text-white/60 hover:bg-white/10 hover:text-white transition-all"
                                            >
                                                {example}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={generateSwapTransaction}
                                        disabled={!prompt.trim() || !isConnected}
                                        className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold hover:from-indigo-600 hover:to-violet-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Generate Swap
                                    </button>

                                    {!isConnected && (
                                        <p className="text-center text-sm text-yellow-400">
                                            Please connect your wallet first
                                        </p>
                                    )}
                                </div>
                            )}

                            {state === 'loading' && (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 border-4 border-white/20 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-white/80">Bankr is analyzing your request...</p>
                                    <p className="text-sm text-white/60 mt-2">Finding the best swap route</p>
                                </div>
                            )}

                            {state === 'preview' && transaction && metadata && (
                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                        <p className="text-sm text-white/60 mb-2">Your request:</p>
                                        <p className="text-white font-medium">{metadata.prompt}</p>
                                    </div>

                                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                                        <p className="text-sm text-green-400 mb-2">✓ Transaction ready</p>
                                        <p className="text-xs text-white/60">
                                            Network: {metadata.chain?.toUpperCase() || 'BASE'}
                                        </p>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={resetModal}
                                            className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={executeSwap}
                                            disabled={isSending}
                                            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50"
                                        >
                                            {isSending ? 'Signing...' : 'Confirm Swap'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {(state === 'signing' || state === 'pending') && (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 border-4 border-white/20 border-t-green-500 rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-white/80">
                                        {state === 'signing' ? 'Please sign in your wallet...' : 'Transaction pending...'}
                                    </p>
                                    {txHash && (
                                        <p className="text-xs text-white/60 mt-2 break-all">
                                            Tx: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                                        </p>
                                    )}
                                </div>
                            )}

                            {isConfirmed && (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-4xl mx-auto mb-4">
                                        ✓
                                    </div>
                                    <p className="text-white font-bold text-xl mb-2">Swap Complete!</p>
                                    <p className="text-white/60 text-sm mb-4">Your tokens have been swapped successfully</p>
                                    {txHash && (
                                        <a
                                            href={`https://basescan.org/tx/${txHash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary-400 hover:text-primary-300 text-sm underline"
                                        >
                                            View on BaseScan →
                                        </a>
                                    )}
                                    <button
                                        onClick={handleClose}
                                        className="w-full mt-6 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-all"
                                    >
                                        Done
                                    </button>
                                </div>
                            )}

                            {state === 'error' && (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center text-4xl mx-auto mb-4">
                                        ⚠️
                                    </div>
                                    <p className="text-white font-bold text-xl mb-2">Swap Failed</p>
                                    <p className="text-white/60 text-sm mb-4">{error}</p>
                                    <button
                                        onClick={resetModal}
                                        className="w-full py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-all"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            )}

                            {/* Footer info */}
                            <div className="mt-6 pt-4 border-t border-white/10">
                                <p className="text-xs text-white/40 text-center">
                                    Swaps powered by Bankr AI • Routing via 0x Protocol
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
