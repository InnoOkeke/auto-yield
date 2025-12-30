'use client';

import { useState, useEffect } from 'react';
import { useConnect, useAccount } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { isFarcasterContext } from '@/lib/farcaster';

export default function ConnectWallet({ onConnect }: { onConnect: () => void }) {
    const { connect } = useConnect();
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
            <button
                onClick={handleConnect}
                disabled={loading || isConnected}
                className="w-full py-6 px-6 rounded-2xl bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-2xl"
            >
                {loading && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {loading ? 'Connecting...' : isConnected ? '✓ Wallet Connected' : '🔗 Connect Wallet'}
            </button>

            <div className="grid grid-cols-2 gap-4">
                {[
                    { name: 'Coinbase Wallet', icon: '🔵' },
                    { name: 'Base Wallet', icon: '⚡' },
                ].map((wallet) => (
                    <button
                        key={wallet.name}
                        onClick={handleConnect}
                        className="py-4 px-4 rounded-xl glass hover:bg-white/20 transition-all text-white font-medium flex flex-col items-center gap-2"
                    >
                        <span className="text-3xl">{wallet.icon}</span>
                        <span className="text-sm">{wallet.name}</span>
                    </button>
                ))}
            </div>

            <p className="text-center text-white/50 text-sm mt-4">
                By connecting, you agree to our Terms of Service
            </p>
        </div>
    );
}
