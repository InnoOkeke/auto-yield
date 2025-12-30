import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import FarcasterInitializer from "@/components/FarcasterInitializer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "AutoYield - Automated DeFi Savings",
    description: "Automate your DeFi savings with daily USDC deductions earning yield on Base",
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
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
