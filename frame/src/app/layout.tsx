import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import FarcasterInitializer from "@/components/FarcasterInitializer";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Meluri Auto Yield - Automated DeFi Savings",
    description: "Automate your DeFi savings with daily USDC deductions earning yield on Base",
    icons: {
        icon: '/logo.png',
        apple: '/logo.png',
    },
    openGraph: {
        title: "Meluri Auto Yield",
        description: "Automate your DeFi savings with daily USDC deductions earning yield on Base",
        url: "https://auto-yield-eight.vercel.app",
        siteName: "Meluri Auto Yield",
        images: [
            {
                url: "https://auto-yield-eight.vercel.app/splash.png",
                width: 1200,
                height: 630,
            },
        ],
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Meluri Auto Yield",
        description: "Automate your DeFi savings with daily USDC deductions earning yield on Base",
        images: ["https://auto-yield-eight.vercel.app/splash.png"],
    },
    other: {
        "fc:frame": "vNext",
        "fc:frame:image": "https://auto-yield-eight.vercel.app/splash.png",
        "fc:frame:button:1": "Start Earning",
        "fc:frame:action:1": "post",
        "fc:frame:target:1": "https://auto-yield-eight.vercel.app",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <FarcasterInitializer />
                <Providers>
                    <div className="flex flex-col min-h-screen">
                        <Header />
                        <main className="flex-grow pt-16">
                            {children}
                        </main>
                        <Footer />
                    </div>
                </Providers>
            </body>
        </html>
    );
}
