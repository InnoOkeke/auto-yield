'use client';

import Link from 'next/link';
import Image from 'next/image';
import HeaderConnect from './HeaderConnect';
import ThemeToggle from './ThemeToggle';

export default function Header() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-foreground/5 dark:border-white/5">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <Image src="/logo.png" alt="Meluri AutoYield" width={40} height={40} className="w-10 h-10 object-contain" />
                    <div className="flex flex-col leading-tight">
                        <span className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">
                            Meluri
                        </span>
                        <span className="text-xl font-bold text-primary-600 dark:text-white font-display -mt-1">
                            AutoYield
                        </span>
                    </div>
                </Link>

                <nav className="flex items-center gap-3">
                    <ThemeToggle />
                    <HeaderConnect />
                </nav>
            </div>
        </header>
    );
}
