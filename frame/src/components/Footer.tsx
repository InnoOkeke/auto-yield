'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-dark-bg py-8 border-t border-white/5 mt-auto">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Image src="/logo.png" alt="Meluri Auto Yield" width={24} height={24} className="w-6 h-6 object-contain opacity-50" />
                        <span className="text-white/40 text-sm">
                            © {new Date().getFullYear()} Meluri Auto Yield
                        </span>
                    </div>

                    <div className="flex gap-6 text-sm text-white/40">
                        <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                        <a href="#" className="hover:text-white transition-colors">Twitter</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
