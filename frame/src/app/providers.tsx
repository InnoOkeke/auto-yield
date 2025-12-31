'use client';

import { ReactNode, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { base } from 'wagmi/chains';
import { http, createConfig } from 'wagmi';
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';

const queryClient = new QueryClient();

export default function Providers({ children }: { children: ReactNode }) {
    const config = useMemo(() => createConfig({
        chains: [base],
        connectors: [
            farcasterMiniApp()
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
