'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
    return (
        <footer className="bg-background py-8 border-t border-foreground/5 mt-auto">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <Image src="/logo.png" alt="Meluri AutoYield" width={24} height={24} className="w-6 h-6 object-contain opacity-50 grayscale hover:grayscale-0 transition-all" />
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
