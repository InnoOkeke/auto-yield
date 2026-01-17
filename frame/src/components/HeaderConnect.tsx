'use client';

import { useState } from 'react';
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { farcasterSDK } from '@/lib/farcaster';
import { injected } from 'wagmi/connectors';
import { base } from 'wagmi/chains';
import UserAvatar from './UserAvatar';

export default function HeaderConnect() {
    const { address, isConnected } = useAccount();
    const { connect, connectors } = useConnect();
    const { disconnect } = useDisconnect();
    const chainId = useChainId();
    const { switchChain } = useSwitchChain();
    const [loading, setLoading] = useState(false);

    const handleSignIn = async () => {
        setLoading(true);
        try {
            // Connect Wallet for Transactions
            const isMiniAppEnv = !!(window as any).farcaster?.context;
            console.log('Connect Status - Env:', isMiniAppEnv ? 'Mini App' : 'Browser');
            console.log('Connect Status - Available Connectors:', connectors.map(c => c.id));

            if (isMiniAppEnv) {
                const miniAppWallet = connectors.find(c => c.id === 'farcaster' || c.name.toLowerCase().includes('farcaster'));
                if (miniAppWallet) {
                    console.log('Connecting via Mini App...');
                    await connect({ connector: miniAppWallet });
                    return;
                }
            }

            // If not in mini-app, prioritize injected wallets (MetaMask, etc.)
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
                alert('No wallet found. Please install a wallet extension.');
            }
        } catch (error) {
            console.error('Sign In Failed:', error);
        } finally {
            setLoading(false);
        }
    };

    if (isConnected && address) {
        // Check if on correct network (Base is 8453)
        if (chainId !== base.id) {
            return (
                <button
                    onClick={() => switchChain({ chainId: base.id })}
                    className="px-3 py-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-black font-semibold text-xs transition-all shadow-sm flex items-center gap-2"
                >
                    <span className="animate-pulse">⚠️</span>
                    Switch to Base
                </button>
            );
        }

        return (
            <button
                onClick={() => disconnect()}
                className="px-2 py-1 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors flex items-center gap-2 border border-foreground/5"
            >
                <UserAvatar size="sm" showName={true} />
            </button>
        );
    }

    return (
        <button
            onClick={handleSignIn}
            disabled={loading}
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 hover:opacity-90 text-white font-medium text-xs transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
        >
            {loading ? (
                <>
                    <span className="animate-spin text-[10px]">⏳</span>
                    <span>Connecting...</span>
                </>
            ) : (
                <>
                    <span>🔗</span>
                    <span>Connect</span>
                </>
            )}
        </button>
    );
}

