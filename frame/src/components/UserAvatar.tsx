'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useUserProfile } from '@/hooks/useUserProfile';

interface UserAvatarProps {
    size?: 'sm' | 'md' | 'lg';
    showName?: boolean;
    className?: string;
}

const sizes = {
    sm: { avatar: 28, text: 'text-sm' },
    md: { avatar: 36, text: 'text-base' },
    lg: { avatar: 48, text: 'text-lg' },
};

/**
 * User avatar component that shows profile picture and username
 * Required for Base App Featured status - avoids showing 0x addresses
 */
export default function UserAvatar({
    size = 'md',
    showName = true,
    className = ''
}: UserAvatarProps) {
    const { displayName, pfpUrl, loading } = useUserProfile();
    const { avatar: avatarSize, text: textSize } = sizes[size];
    const [imageError, setImageError] = useState(false);

    if (loading) {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <div
                    className="rounded-full bg-foreground/10 animate-pulse"
                    style={{ width: avatarSize, height: avatarSize }}
                />
                {showName && (
                    <div className="h-4 w-20 bg-foreground/10 rounded animate-pulse" />
                )}
            </div>
        );
    }

    const showFallback = !pfpUrl || imageError;

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {/* Avatar */}
            {!showFallback ? (
                <Image
                    src={pfpUrl}
                    alt={displayName}
                    width={avatarSize}
                    height={avatarSize}
                    className="rounded-full object-cover border-2 border-foreground/10"
                    unoptimized
                    onError={() => setImageError(true)}
                />
            ) : (
                <div
                    className="rounded-full bg-primary flex items-center justify-center text-white font-bold"
                    style={{ width: avatarSize, height: avatarSize, fontSize: avatarSize * 0.4 }}
                >
                    {displayName.slice(0, 1).toUpperCase()}
                </div>
            )}

            {/* Name */}
            {showName && (
                <span className={`font-medium text-foreground ${textSize}`}>
                    {displayName}
                </span>
            )}
        </div>
    );
}
