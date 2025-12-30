import { Metadata } from 'next';
import Hero from '@/components/Hero';
import FeatureSection from '@/components/FeatureSection';

export const metadata: Metadata = {
    title: 'Meluri Auto Yield - Start Earning',
    other: {
        'fc:frame': 'vNext',
        'fc:frame:image': `${process.env.NEXT_PUBLIC_FRAME_URL}/api/og`,
        'fc:frame:button:1': 'Start Earning 💰',
        'fc:frame:button:1:action': 'link',
        'fc:frame:button:1:target': `${process.env.NEXT_PUBLIC_FRAME_URL}/onboard`,
        'fc:frame:button:2': 'My Dashboard 📊',
        'fc:frame:button:2:action': 'link',
        'fc:frame:button:2:target': `${process.env.NEXT_PUBLIC_FRAME_URL}/dashboard`,
        'og:title': 'Meluri Auto Yield - Automated DeFi Savings',
        'og:description': 'Save daily, earn automatically on Base',
        'og:image': `${process.env.NEXT_PUBLIC_FRAME_URL}/api/og`,
    },
};

async function getStats() {
    try {
        // Prevent build failure if API is offline
        if (!process.env.NEXT_PUBLIC_API_URL) return null;

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stats`, {
            next: { revalidate: 3600 } // Revalidate every hour
        });
        if (!res.ok) return null;
        return res.json();
    } catch (e) {
        console.error('Failed to fetch stats:', e);
        return null;
    }
}

export default async function Home() {
    const stats = await getStats();
    const apy = stats?.vault?.apy ? Number(stats.vault.apy).toFixed(2) : 9.45;

    return (
        <div className="container mx-auto px-4 py-8">
            <Hero apy={Number(apy)} />
            <FeatureSection />
        </div>
    );
}
