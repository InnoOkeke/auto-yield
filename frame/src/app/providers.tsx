'use client';

import { ReactNode, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { base } from 'wagmi/chains';
import { http, createConfig } from 'wagmi';
import { injected } from 'wagmi/connectors';

const queryClient = new QueryClient();

import { farcasterSDK } from '@/lib/farcaster';

// ...

export default function Providers({ children }: { children: ReactNode }) {
    const config = useMemo(() => createConfig({
        chains: [base],
        connectors: [
            injected({
                target: () => {
                    if (typeof window === 'undefined') return undefined;

                    // Priority: Farcaster SDK Provider -> window.ethereum
                    // This handles cases where SDK might be slow or we are in a dev environment/shimmed environment
                    const provider = farcasterSDK.wallet?.ethProvider || (window as any).ethereum;

                    if (!provider) {
                        console.warn('Wagmi Provider: No provider found (SDK or window.ethereum)');
                    } else {
                        console.log('Wagmi Provider: Found provider', { isSdk: !!farcasterSDK.wallet?.ethProvider, isWindow: !!(window as any).ethereum });
                    }

                    return provider as any;
                }
            }),
        ],
        transports: {
            [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'),
        },
    }), []);

    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </WagmiProvider>
    );
}
