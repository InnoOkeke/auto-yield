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

export default function Home() {
    return (
        <div className="container mx-auto px-4 py-8">
            <Hero />
            <FeatureSection />
        </div>
    );
}
