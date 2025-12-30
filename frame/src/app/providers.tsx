'use client';

import { ReactNode, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { base } from 'wagmi/chains';
import { http, createConfig } from 'wagmi';
import { injected } from 'wagmi/connectors';

const queryClient = new QueryClient();

export default function Providers({ children }: { children: ReactNode }) {
    const config = useMemo(() => createConfig({
        chains: [base],
        connectors: [injected()],
        transports: {
            [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL),
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
