import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicy() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-4xl font-bold mb-8 text-white">Privacy Policy</h1>
            <p className="text-white/60 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

            <div className="prose prose-invert max-w-none">
                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-white">1. Introduction</h2>
                    <p className="text-white/80">
                        Meluri (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) respects your privacy and is committed to protecting it through our compliance with this policy.
                        This policy describes the types of information we may collect from you or that you may provide when you visit the Auto Yield application (the &quot;App&quot;)
                        and our practices for collecting, using, maintaining, protected, and disclosing that information.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-white">2. Information We Collect</h2>
                    <p className="text-white/80 mb-4">
                        We collect minimal information to provide our Decentralized Finance (DeFi) services:
                    </p>
                    <ul className="list-disc pl-6 text-white/80 space-y-2">
                        <li>
                            <strong>Public Blockchain Data:</strong> When you connect your wallet, we may collect and index your public blockchain address and interactions with the Auto Yield smart contracts.
                            This information is publicly available on the blockchain.
                        </li>
                        <li>
                            <strong>Device Information:</strong> We may collect information about your internet connection, the equipment you use to access our App, and usage details.
                        </li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-white">3. How We Use Your Information</h2>
                    <p className="text-white/80">
                        We use the information we collect to:
                    </p>
                    <ul className="list-disc pl-6 text-white/80 space-y-2 mt-2">
                        <li>Provide, operate, and maintain the Auto Yield app.</li>
                        <li>Facilitate your interactions with the Base blockchain and AvantisFi protocols.</li>
                        <li>Improve, personalize, and expand our services.</li>
                        <li>Detect and prevent fraud, spam, abuse, security incidents, and other harmful activity.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-white">4. Third-Party Services</h2>
                    <p className="text-white/80">
                        Our App interacts with third-party services, including but not limited to the Base blockchain and AvantisFi protocol.
                        We do not control these third parties and are not responsible for their privacy statements.
                        When you use these protocols, you are interacting directly with the blockchain.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-white">5. Data Security</h2>
                    <p className="text-white/80">
                        We hold no custodial control over your funds or private keys. All transactions are executed directly by you on the blockchain.
                        We implement reasonable security measures to maintain the safety of the specific data we process, but remember that no method of transmission over the Internet is 100% secure.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-white">6. Contact Us</h2>
                    <p className="text-white/80">
                        If you have any questions about this Privacy Policy, please contact us via our official social media channels.
                    </p>
                </section>
            </div>

            <div className="mt-12 pt-8 border-t border-white/10">
                <Link href="/" className="text-primary-400 hover:text-primary-300 transition-colors">
                    &larr; Back to Home
                </Link>
            </div>
        </div>
    );
}
