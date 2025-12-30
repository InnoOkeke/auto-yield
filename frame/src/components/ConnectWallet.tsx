'use client';

import { useState, useEffect } from 'react';
import { useConnect, useAccount, useChainId, useSwitchChain } from 'wagmi';
import { base } from 'wagmi/chains';
import { isFarcasterContext } from '@/lib/farcaster';

export default function ConnectWallet({ onConnect }: { onConnect: () => void }) {
    const { connect, connectors } = useConnect();
    const { isConnected } = useAccount();
    const chainId = useChainId();
    const { switchChain } = useSwitchChain();

    const [loading, setLoading] = useState(false);
    const [inFarcaster, setInFarcaster] = useState(false);

    useEffect(() => {
        setInFarcaster(isFarcasterContext());

        // Auto-connect in Farcaster context
        if (isFarcasterContext() && !isConnected) {
            handleConnect();
        }
    }, []);

    useEffect(() => {
        if (isConnected && !loading) {
            // Only proceed if on Base
            if (chainId === base.id) {
                onConnect();
            }
        }
    }, [isConnected, chainId, loading]);

    const handleConnect = async () => {
        setLoading(true);
        try {
            // Default to Coinbase Smart Wallet
            const connector = connectors.find(c => c.name === 'Coinbase Wallet');
            if (connector) connect({ connector });
        } catch (error) {
            console.error('Failed to connect:', error);
        } finally {
            setLoading(false);
        }
    };

    // Network Enforcement UI
    if (isConnected && chainId !== base.id) {
        return (
            <div className="space-y-4 text-center animate-pulse-glow p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                <div className="text-4xl mb-2">⚠️</div>
                <h3 className="text-red-400 font-bold text-xl">Wrong Network</h3>
                <p className="text-white/70 text-sm">
                    Autoyield only works on Base. <br /> Please switch your network to continue.
                </p>
                <button
                    onClick={() => switchChain({ chainId: base.id })}
                    className="w-full py-3 px-6 rounded-xl font-bold transition-all shadow-lg bg-red-500 hover:bg-red-600 text-white mt-4"
                >
                    Switch to Base 🔵
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="text-center mb-6">
                <p className="text-white/80">
                    Connect with your Smart Wallet to continue.
                </p>
            </div>

            <div className="space-y-4">
                {connectors
                    .filter(c => c.name === 'Coinbase Wallet')
                    .map((connector) => (
                        <button
                            key={connector.uid}
                            onClick={() => connect({ connector })}
                            className="w-full py-4 px-6 rounded-2xl font-semibold text-lg transition-all flex items-center justify-center gap-3 shadow-lg bg-[#0052FF] hover:bg-[#0052FF]/90 text-white"
                        >
                            <span className="text-2xl">🔵</span>
                            <span>Smart Wallet (Recommended)</span>
                        </button>
                    ))}
            </div>

            <p className="text-center text-white/50 text-sm mt-4">
                By connecting, you agree to our Terms of Service
            </p>
        </div>
    );
}
