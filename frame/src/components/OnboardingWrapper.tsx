'use client';

import { useState, useEffect } from 'react';
import OnboardingFlow from './OnboardingFlow';

interface OnboardingWrapperProps {
    children: React.ReactNode;
}

/**
 * Wrapper that shows onboarding flow on first visit
 * Required for Base App Featured status
 */
export default function OnboardingWrapper({ children }: OnboardingWrapperProps) {
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Check if user has seen onboarding
        const hasSeenOnboarding = localStorage.getItem('autoyield-onboarding-complete');
        if (!hasSeenOnboarding) {
            setShowOnboarding(true);
        }
    }, []);

    const handleOnboardingComplete = () => {
        setShowOnboarding(false);
    };

    // Avoid hydration mismatch
    if (!mounted) {
        return <>{children}</>;
    }

    return (
        <>
            {showOnboarding && (
                <OnboardingFlow onComplete={handleOnboardingComplete} />
            )}
            {children}
        </>
    );
}
