'use client';

import { useState, useEffect } from 'react';
import { useConnect, useAccount, useChainId, useSwitchChain } from 'wagmi';
import { base } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import { isFarcasterContext, farcasterSDK } from '@/lib/farcaster';

type SignInState = 'idle' | 'loading' | 'success' | 'error';

export default function ConnectWallet({ onConnect }: { onConnect: () => void }) {
    const { connect, connectors } = useConnect();
    const { isConnected } = useAccount();
    const chainId = useChainId();
    const { switchChain } = useSwitchChain();

    const [signInState, setSignInState] = useState<SignInState>('idle');
    const [inFarcaster, setInFarcaster] = useState(false);

    useEffect(() => {
        setInFarcaster(isFarcasterContext());

        // Check if we already have a session? 
        // For now, let's assume we rely on wagmi connection status or session state.
        if (isFarcasterContext() && !isConnected) {
            // maybe auto-sign in? Or wait for user action?
            // User requested "Sign In" button, so we likely wait.
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSignIn = async () => {
        setSignInState('loading');
        try {
            // 1. Request Sign In signature from Farcaster
            // const nonce = "example-nonce"; // In production, fetch from backend via API
            // const result = await farcasterSDK.actions.signIn({ nonce });

            // console.log('Farcaster Sign In Result:', result);

            // 2. Connect Wallet for Transactions (Injected Provider)
            // Even though we signed in for auth, we need the provider for wagmi
            // Look for the specific Farcaster connector first, or just use the first available one as we configured it in providers
            const fcWallet = connectors.find(c => c.id === 'farcaster' || c.name.toLowerCase().includes('farcaster')) || connectors[0];

            if (fcWallet) {
                await connect({ connector: fcWallet });
            } else {
                // Fallback to manual injection if no connector found (unlikely)
                await connect({
                    connector: injected({
                        target: () => {
                            const provider = farcasterSDK.wallet?.ethProvider || (window as any).ethereum;
                            return provider as any;
                        }
                    })
                });
            }

            setSignInState('success');
            onConnect();

        } catch (error) {
            console.error('Sign In Failed:', error);
            setSignInState('error');
        } finally {
            setSignInState('idle');
        }
    };

    if (isConnected) {
        return (
            <div className="text-center p-4 glass rounded-2xl">
                <p className="text-green-500 dark:text-green-400 font-bold mb-2">✅ Signed In</p>
                <p className="text-sm text-muted">Ready to earn yield</p>
            </div>
        );
    }

    return (
        <button
            onClick={handleSignIn}
            disabled={signInState === 'loading'}
            className="w-full py-4 px-6 rounded-2xl font-semibold text-lg transition-all flex items-center justify-center gap-3 shadow-lg bg-[#855DCD] hover:bg-[#855DCD]/90 text-white disabled:opacity-50"
        >
            <span className="text-2xl">{signInState === 'loading' ? '⏳' : '🟣'}</span>
            <span>
                {signInState === 'loading' ? 'Signing In...' : 'Sign in with Farcaster'}
            </span>
        </button>
    );
}
