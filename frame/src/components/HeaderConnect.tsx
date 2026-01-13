'use client';

import { useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { farcasterSDK } from '@/lib/farcaster';
import { injected } from 'wagmi/connectors';

export default function HeaderConnect() {
    const { address, isConnected } = useAccount();
    const { connect, connectors } = useConnect();
    const { disconnect } = useDisconnect();
    const [loading, setLoading] = useState(false);

    const handleSignIn = async () => {
        setLoading(true);
        try {
            // 1. Request Sign In signature from Farcaster
            // Removed blocking signIn call as we don't use the signature for auth yet, and it might hang.
            // await farcasterSDK.actions.signIn({ nonce: "example-nonce" });

            // 2. Connect Wallet for Transactions
            // 2. Connect Wallet for Transactions
            // Look for the specific Farcaster connector first, or just use the first available one as we configured it in providers
            const fcWallet = connectors.find(c => c.id === 'farcaster' || c.name.toLowerCase().includes('farcaster')) || connectors[0];

            if (fcWallet) {
                await connect({ connector: fcWallet });
            } else {
                // Fallback to manual injection if no connector found
                await connect({
                    connector: injected({
                        target: () => {
                            const provider = farcasterSDK.wallet?.ethProvider || (window as any).ethereum;
                            return provider as any;
                        }
                    })
                });
            }
        } catch (error) {
            console.error('Sign In Failed:', error);
        } finally {
            setLoading(false);
        }
    };

    if (isConnected && address) {
        return (
            <button
                onClick={() => disconnect()}
                className="px-4 py-2 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-foreground dark:text-white font-medium text-sm transition-colors flex items-center gap-2 border border-foreground/5"
            >
                <div className="w-2 h-2 rounded-full bg-green-500" />
                {address.slice(0, 6)}...{address.slice(-4)}
            </button>
        );
    }

    return (
        <button
            onClick={handleSignIn}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white font-medium text-sm transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
        >
            {loading ? (
                <>
                    <span className="animate-spin text-xs">⏳</span>
                    <span>Signing...</span>
                </>
            ) : (
                <>
                    <span>Sign In</span>
                </>
            )}
        </button>
    );
}
