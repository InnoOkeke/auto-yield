'use client';

import { useAccount } from 'wagmi';
import ActivityFeed from '@/components/ActivityFeed';
import Link from 'next/link';

export default function HistoryPage() {
    const { address, isConnected } = useAccount();

    if (!isConnected) {
        return (
            <div className="flex items-center justify-center p-4 min-h-[calc(100vh-8rem)]">
                <div className="text-center">
                    <p className="text-white/70 mb-4">Please connect your wallet to view history</p>
                    <Link href="/onboard" className="text-primary-400 hover:text-primary-300">Connect Wallet</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8">
            <div className="container mx-auto max-w-4xl">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/dashboard" className="p-2 rounded-full glass hover:bg-white/20 transition-all text-white">
                        ← Back
                    </Link>
                    <h1 className="text-3xl font-bold text-white">Transaction History</h1>
                </div>

                {/* Reuse ActivityFeed but we might want to make it look 'full page' 
                    For now, wrapping it in a div is fine. ActivityFeed handles its own fetching.
                */}
                <ActivityFeed address={address!} />
            </div>
        </div>
    );
}
