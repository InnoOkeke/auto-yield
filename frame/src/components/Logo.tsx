'use client';

import Image from 'next/image';

export default function Logo({ className = "w-10 h-10" }: { className?: string }) {
    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            <Image
                src="/logo.png"
                alt="Meluri AutoYield"
                width={512}
                height={512}
                className="w-full h-full object-contain dark:invert scale-150"
                priority
            />
        </div>
    );
}
