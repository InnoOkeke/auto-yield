'use client';

import { useState, useEffect } from 'react';
import { useConnect, useAccount, useChainId, useSwitchChain } from 'wagmi';
import { base } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import { isFarcasterContext, farcasterSDK } from '@/lib/farcaster';

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
            if (chainId === base.id) {
                onConnect();
            }
        }
    }, [isConnected, chainId, loading]);

    const handleConnect = async () => {
        setLoading(true);
        try {
            console.log('Available connectors:', connectors.map(c => ({ id: c.id, name: c.name, type: c.type })));

            // 1. Try to find the specific injected connector we configured
            let fcWallet = connectors.find(c => c.id === 'injected');

            if (fcWallet) {
                await connect({ connector: fcWallet });
            } else {
                // 2. Fallback: Instantiate a new injected connector targeting the Farcaster provider directly
                console.warn('Farcaster connector not found in list. Attempting direct connection...');

                await connect({
                    connector: injected({
                        target: () => {
                            // Priority: Farcaster SDK Provider -> window.ethereum
                            const provider = farcasterSDK.wallet?.ethProvider || (window as any).ethereum;
                            return provider as any;
                        }
                    })
                });
            }
        } catch (error) {
            console.error('Failed to connect:', error);
            // Optionally show user friendly error
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
                    Connect with your Farcaster Wallet to continue.
                </p>
            </div>

            <div className="space-y-4">
                <button
                    onClick={handleConnect}
                    disabled={loading || isConnected}
                    className="w-full py-4 px-6 rounded-2xl font-semibold text-lg transition-all flex items-center justify-center gap-3 shadow-lg bg-[#855DCD] hover:bg-[#855DCD]/90 text-white disabled:opacity-50"
                >
                    <span className="text-2xl">{loading ? '⏳' : '🟣'}</span>
                    <span>
                        {loading ? 'Connecting...' : 'Connect Farcaster'}
                    </span>
                </button>
            </div>

            <p className="text-center text-white/50 text-sm mt-4">
                By connecting, you agree to our Terms of Service
            </p>
        </div>
    );
}
