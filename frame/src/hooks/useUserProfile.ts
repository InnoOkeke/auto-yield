'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { sdk } from '@farcaster/miniapp-sdk';

interface UserProfile {
    username: string;
    displayName: string;
    pfpUrl: string;
    fid: number;
}

/**
 * Hook to get user profile from mini-app context
 * Shows avatar + username instead of 0x addresses (required for Featured status)
 */
export function useUserProfile() {
    const { address } = useAccount();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProfile() {
            try {
                const context = await sdk.context;

                if (context?.user) {
                    setProfile({
                        username: context.user.username || '',
                        displayName: context.user.displayName || context.user.username || '',
                        pfpUrl: context.user.pfpUrl || '',
                        fid: context.user.fid || 0,
                    });
                }
            } catch (error) {
                console.error('Failed to get user profile:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchProfile();
    }, []);

    // Format address for display (shortened if no profile)
    const displayAddress = address
        ? `${address.slice(0, 6)}...${address.slice(-4)}`
        : '';

    return {
        profile,
        loading,
        displayName: profile?.displayName || profile?.username || displayAddress,
        username: profile?.username || displayAddress,
        pfpUrl: profile?.pfpUrl || null,
        fid: profile?.fid || null,
        address,
        displayAddress,
    };
}

export default useUserProfile;
