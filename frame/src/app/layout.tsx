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
    other: {
        "fc:frame": "vNext",
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
