'use client';

import { useEffect } from 'react';
import { farcasterSDK } from '@/lib/farcaster';

export default function FarcasterInitializer() {
    useEffect(() => {
        // Call ready() to dismiss Farcaster loading screen
        farcasterSDK.actions.ready();
    }, []);

    return null;
}
