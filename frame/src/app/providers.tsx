'use client';

import { ReactNode, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { base } from 'wagmi/chains';
import { http, createConfig } from 'wagmi';
import { coinbaseWallet, injected } from 'wagmi/connectors';

const queryClient = new QueryClient();

import { farcasterSDK } from '@/lib/farcaster';

// ...

export default function Providers({ children }: { children: ReactNode }) {
    const config = useMemo(() => createConfig({
        chains: [base],
        connectors: [
            coinbaseWallet({ appName: 'Meluri Auto Yield', preference: 'smartWalletOnly' }),
            injected({
                target: () => {
                    if (typeof window !== 'undefined' && farcasterSDK.wallet?.ethProvider) {
                        return farcasterSDK.wallet.ethProvider as any;
                    }
                    return undefined;
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
