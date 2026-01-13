```
import React from 'react';
import Link from 'next/link';

export default function TermsOfUse() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-4xl font-bold mb-8 text-foreground font-display">Terms of Use</h1>
            <p className="text-muted mb-8 font-medium text-sm">Last Updated: {new Date().toLocaleDateString()}</p>

            <div className="prose dark:prose-invert max-w-none">
                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground font-display">1. Acceptance of Terms</h2>
                    <p className="text-foreground/80 font-medium">
                        By accessing or using the Meluri Auto Yield application (&quot;App&quot;), you agree to be bound by these Terms of Use.
                        If you do not agree to these terms, you may not access or use usage of the App.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground font-display">2. DeFi Risks</h2>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 mb-6 shadow-sm">
                        <h3 className="text-red-600 dark:text-red-400 font-bold mb-3 flex items-center gap-2">
                            <span>⚠️</span> IMPORTANT WARNING
                        </h3>
                        <p className="text-foreground/80 text-sm font-medium leading-relaxed">
                            Auto Yield creates a Non-Custodial interaction with the AvantisFi protocol on the Base blockchain.
                            Using DeFi protocols involves significant risks.
                        </p>
                    </div>
                    <p className="text-foreground/80 mb-2 font-medium">You acknowledge and agree that:</p>
                    <ul className="list-disc pl-6 text-foreground/70 space-y-2 font-medium">
                        <li>You are using the App at your own risk.</li>
                        <li>We do not have custody of your funds at any time.</li>
                        <li>Values of crypto-assets can fluctuate substantially.</li>
                        <li>Smart contracts may contain bugs, vulnerabilities, or errors that could lead to loss of funds.</li>
                        <li>We are not responsible for any losses you may incur while using the App or underlying protocols.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground font-display">3. User Responsibilities</h2>
                    <p className="text-foreground/80 font-medium">
                        You are solely responsible for:
                    </p>
                    <ul className="list-disc pl-6 text-foreground/70 space-y-2 mt-2 font-medium">
                        <li>Safeguarding your wallet private keys and seed phrases.</li>
                        <li>Ensuring transaction details (addresses, amounts) are correct before confirming.</li>
                        <li>Complying with all applicable laws and regulations in your jurisdiction.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground font-display">4. No Financial Advice</h2>
                    <p className="text-foreground/80 font-medium">
                        The information provided on this App does not constitute investment advice, financial advice, trading advice, or any other sort of advice.
                        You should not treat any of the App&apos;s content as such. Meluri does not recommend that any crypto-asset should be bought, sold, or held by you.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground font-display">5. Limitation of Liability</h2>
                    <p className="text-foreground/80 font-medium">
                        To the maximum extent permitted by law, Meluri shall not be liable for any indirect, incidental, special, consequential, or punitive damages,
                        or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses,
                        resulting from your access to or use of or inability to access or use the App.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-foreground font-display">6. Changes to Terms</h2>
                    <p className="text-foreground/80 font-medium">
                        We reserve the right to modify or replace these Terms at any time. By continuing to access or use our App after those revisions become effective,
                        you agree to be bound by the revised terms.
                    </p>
                </section>
            </div>

            <div className="mt-12 pt-8 border-t border-foreground/10">
                <Link href="/" className="text-primary-600 dark:text-primary-400 hover:opacity-70 transition-opacity font-semibold">
                    &larr; Back to Home
                </Link>
            </div>
        </div>
    );
}
