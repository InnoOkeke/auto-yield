'use client';

import { useState, useEffect } from 'react';
import { useConnect, useAccount } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { isFarcasterContext } from '@/lib/farcaster';

export default function ConnectWallet({ onConnect }: { onConnect: () => void }) {
    const { connect, connectors } = useConnect();
    const { isConnected } = useAccount();
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
            onConnect();
        }
    }, [isConnected]);

    const handleConnect = async () => {
        setLoading(true);
        try {
            connect({ connector: injected() });
        } catch (error) {
            console.error('Failed to connect:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="text-center mb-6">
                <p className="text-white/80">
                    Connect with your Farcaster account or Smart Wallet to continue.
                </p>
            </div>

            <div className="space-y-4">
                {connectors
                    .filter(c => c.name === 'Coinbase Wallet' || c.id === 'injected')
                    .map((connector) => (
                        <button
                            key={connector.uid}
                            onClick={() => connect({ connector })}
                            className={`w-full py-4 px-6 rounded-2xl font-semibold text-lg transition-all flex items-center justify-center gap-3 shadow-lg ${connector.name === 'Coinbase Wallet'
                                ? 'bg-[#0052FF] hover:bg-[#0052FF]/90 text-white'
                                : 'glass hover:bg-white/20 text-white'
                                }`}
                        >
                            <span className="text-2xl">
                                {connector.name === 'Coinbase Wallet' ? '🔵' : '🔌'}
                            </span>
                            <span>
                                {connector.name === 'Coinbase Wallet' ? 'Smart Wallet (Recommended)' : 'Browser Wallet'}
                            </span>
                        </button>
                    ))}
            </div>

            <p className="text-center text-white/50 text-sm mt-4">
                By connecting, you agree to our Terms of Service
            </p>
        </div>
    );
}
