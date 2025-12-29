'use client';

import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { base } from 'wagmi/chains';
import { http, createConfig } from 'wagmi';

const queryClient = new QueryClient();

// Wagmi config for Base network
const config = createConfig({
    chains: [base],
    transports: {
        [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL),
    },
});

export default function Providers({ children }: { children: ReactNode }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </WagmiProvider>
    );
}
