'use client';

import Link from 'next/link';
import Logo from './Logo';

export default function Footer() {
    return (
        <footer className="bg-background py-8 border-t border-foreground/5 mt-auto">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <Logo className="w-10 h-10 opacity-60 grayscale hover:grayscale-0 transition-all text-muted" />
                        <span className="text-muted text-sm font-medium">
                            © {new Date().getFullYear()} Meluri AutoYield
                        </span>
                    </div>

                    <div className="flex gap-6 text-sm text-muted">
                        <Link href="/privacy" className="hover:text-primary-600 dark:hover:text-white transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-primary-600 dark:hover:text-white transition-colors">Terms of Service</Link>
                        <a href="#" className="hover:text-primary-600 dark:hover:text-white transition-colors">Twitter</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
