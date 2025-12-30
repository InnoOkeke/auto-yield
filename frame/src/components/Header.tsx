'use client';

import Link from 'next/link';
import HeaderConnect from './HeaderConnect';

export default function Header() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-primary-900/80 backdrop-blur-md border-b border-white/10">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <img src="/logo.png" alt="Meluri Auto Yield" className="w-8 h-8 object-contain" />
                    <span className="text-xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                        Meluri
                    </span>
                </Link>

                <nav className="flex items-center gap-4">
                    <HeaderConnect />
                </nav>
            </div>
        </header>
    );
}
