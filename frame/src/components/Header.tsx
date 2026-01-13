'use client';

import Link from 'next/link';
import HeaderConnect from './HeaderConnect';
import ThemeToggle from './ThemeToggle';
import Logo from './Logo';

export default function Header() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-foreground/5 dark:border-white/5">
            <div className="container mx-auto px-4 h-20 flex items-center justify-between">
                <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
                    <Logo className="w-20 h-20" />
                </Link>

                <nav className="flex items-center gap-3">
                    <ThemeToggle />
                    <HeaderConnect />
                </nav>
            </div>
        </header>
    );
}
