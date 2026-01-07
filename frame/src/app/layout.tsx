import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import FarcasterInitializer from "@/components/FarcasterInitializer";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";

const inter = Inter({ subsets: ["latin"] });

const appUrl = process.env.NEXT_PUBLIC_FRAME_URL || process.env.NEXT_PUBLIC_APP_URL || "https://auto-yield-eight.vercel.app";

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
        url: appUrl,
        siteName: "Meluri Auto Yield",
        images: [
            {
                url: `${appUrl}/splash.png`,
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
        images: [`${appUrl}/splash.png`],
    },
    other: {
        "fc:frame": "vNext",
        "fc:frame:image": `${appUrl}/splash.png`,
        "fc:frame:button:1": "Start Earning",
        "fc:frame:action:1": "post",
        "fc:frame:target:1": appUrl,
        "fc:miniapp": JSON.stringify({
            version: "next",
            imageUrl: `${appUrl}/splash.png`,
            button: {
                title: "Start Earning",
                action: {
                    type: "launch_frame",
                    url: appUrl,
                    splashImageUrl: `${appUrl}/splash.png`,
                    splashBackgroundColor: "#0f172a"
                }
            }
        })
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
                    <ChatWidget />
                </Providers>
            </body>
        </html>
    );
}
