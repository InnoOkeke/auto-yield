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
                        <div className="glass-dark rounded-3xl p-6 shadow-2xl border border-foreground/10">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center text-white shadow-md">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-foreground">Smart Swap</h2>
                                        <p className="text-sm text-muted">Powered by Bankr AI</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleClose}
                                    className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-muted hover:text-foreground hover:bg-black/10 dark:hover:bg-white/20 transition-all font-bold"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Content based on state */}
                            {state === 'idle' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground/80 mb-2">
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
                                                className="w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-foreground/10 text-foreground placeholder-muted focus:outline-none focus:border-primary-500 resize-none pr-12"
                                                rows={2}
                                                autoFocus
                                            />
                                            <button
                                                onClick={generateSwapTransaction}
                                                disabled={!prompt.trim() || !isConnected}
                                                className="absolute right-2 bottom-2 p-2 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-muted hover:text-foreground transition-all disabled:opacity-0"
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
                                                className="px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/5 text-xs text-muted hover:bg-black/10 dark:hover:bg-white/10 hover:text-foreground transition-all border border-foreground/5 shadow-sm"
                                            >
                                                {example}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={generateSwapTransaction}
                                        disabled={!prompt.trim() || !isConnected}
                                        className="w-full py-4 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                                    >
                                        Generate Swap
                                    </button>

                                    {!isConnected && (
                                        <p className="text-center text-sm text-yellow-600 dark:text-yellow-400">
                                            Please connect your wallet first
                                        </p>
                                    )}
                                </div>
                            )}

                            {state === 'loading' && (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 border-4 border-foreground/10 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-foreground/80 font-medium">Bankr is analyzing your request...</p>
                                    <p className="text-sm text-muted mt-2">Finding the best swap route</p>
                                </div>
                            )}

                            {state === 'preview' && transaction && metadata && (
                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-foreground/10">
                                        <p className="text-sm text-muted mb-2">Your request:</p>
                                        <p className="text-foreground font-medium">{metadata.prompt}</p>
                                    </div>

                                    <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800">
                                        <p className="text-sm text-primary-600 dark:text-primary-400 mb-2 font-bold uppercase tracking-wider">✓ Transaction ready</p>
                                        <p className="text-xs text-muted font-medium">
                                            Network: {metadata.chain?.toUpperCase() || 'BASE'}
                                        </p>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={resetModal}
                                            className="flex-1 py-3 rounded-xl bg-black/5 dark:bg-white/10 text-foreground font-medium hover:bg-black/10 dark:hover:bg-white/20 transition-all border border-foreground/10"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={executeSwap}
                                            disabled={isSending}
                                            className="flex-1 py-3 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 transition-all shadow-md"
                                        >
                                            {isSending ? 'Signing...' : 'Confirm Swap'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {(state === 'signing' || state === 'pending') && (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 border-4 border-foreground/10 border-t-green-500 rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-foreground/80 font-medium">
                                        {state === 'signing' ? 'Please sign in your wallet...' : 'Transaction pending...'}
                                    </p>
                                    {txHash && (
                                        <p className="text-xs text-muted mt-2 break-all font-mono">
                                            Tx: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                                        </p>
                                    )}
                                </div>
                            )}

                            {isConfirmed && (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center text-4xl text-white mx-auto mb-4 shadow-lg">
                                        ✓
                                    </div>
                                    <p className="text-foreground font-bold text-xl mb-2">Swap Complete!</p>
                                    <p className="text-muted text-sm mb-4">Your tokens have been swapped successfully</p>
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
                                        className="w-full mt-6 py-3 rounded-xl bg-black/5 dark:bg-white/10 text-foreground font-medium hover:bg-black/10 dark:hover:bg-white/20 transition-all border border-foreground/10"
                                    >
                                        Done
                                    </button>
                                </div>
                            )}

                            {state === 'error' && (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 rounded-full bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <p className="text-foreground font-bold text-xl mb-2">Swap Failed</p>
                                    <p className="text-muted text-sm mb-4">{error}</p>
                                    <button
                                        onClick={resetModal}
                                        className="w-full py-3 rounded-xl bg-secondary-100 dark:bg-secondary-800 text-foreground font-medium hover:bg-secondary-200 dark:hover:bg-secondary-700 transition-all border border-foreground/5"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            )}

                            {/* Footer info */}
                            <div className="mt-6 pt-4 border-t border-foreground/10">
                                <p className="text-xs text-muted/60 text-center">
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
