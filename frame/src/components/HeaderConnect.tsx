'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';

export default function HeaderConnect() {
    const { address, isConnected } = useAccount();
    const { connect, connectors } = useConnect();
    const { disconnect } = useDisconnect();

    const handleConnect = () => {
        const fcWallet = connectors.find(c => c.id === 'injected');
        if (fcWallet) {
            connect({ connector: fcWallet });
        }
    };

    if (isConnected && address) {
        return (
            <button
                onClick={() => disconnect()}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-colors flex items-center gap-2"
            >
                <div className="w-2 h-2 rounded-full bg-green-500" />
                {address.slice(0, 6)}...{address.slice(-4)}
            </button>
        );
    }

    return (
        <button
            onClick={handleConnect}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white font-medium text-sm transition-all"
        >
            Connect Wallet
        </button>
    );
}
