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
            const isFarcasterEnv = !!(window as any).farcaster?.context;
            console.log('Connect Status - Env:', isFarcasterEnv ? 'Farcaster' : 'Browser');
            console.log('Connect Status - Available Connectors:', connectors.map(c => c.id));

            if (isFarcasterEnv) {
                const fcWallet = connectors.find(c => c.id === 'farcaster' || c.name.toLowerCase().includes('farcaster'));
                if (fcWallet) {
                    console.log('Connecting to Farcaster...');
                    await connect({ connector: fcWallet });
                    return;
                }
            }

            // If not in Farcaster, prioritize injected wallets (MetaMask, etc.)
            const injectedWallet = connectors.find(c => c.id === 'injected' || c.id === 'metaMask' || c.id === 'io.metamask');
            const targetConnector = injectedWallet || connectors.find(c => c.id !== 'farcaster');

            if (targetConnector) {
                console.log('Connecting to Wallet:', targetConnector.id);
                await connect({ connector: targetConnector });
            } else if (connectors.length > 0) {
                console.log('Fallback to first connector:', connectors[0].id);
                await connect({ connector: connectors[0] });
            } else {
                console.error('No wallet connectors found');
                alert('No wallet found. Please install MetaMask or another extension.');
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
            className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
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
