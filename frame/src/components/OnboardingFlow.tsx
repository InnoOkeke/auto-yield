'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingFlowProps {
    onComplete: () => void;
}

const slides = [
    {
        title: 'Welcome to AutoYield',
        description: 'Automate your DeFi savings and earn yield on Base — all on autopilot.',
        bg: 'bg-primary-600/10',
    },
    {
        title: 'Set Your Daily Amount',
        description: 'Choose how much USDC to save daily. Start with as little as $1.',
        bg: 'bg-primary-600/10',
    },
    {
        title: 'Earn While You Sleep',
        description: 'Your savings automatically earn yield in DeFi vaults. No manual work needed.',
        bg: 'bg-primary-600/10',
    },
];

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

    useEffect(() => {
        // Check if user has already seen onboarding
        const seen = localStorage.getItem('autoyield-onboarding-complete');
        if (seen) {
            setHasSeenOnboarding(true);
            onComplete();
        }
    }, [onComplete]);

    const handleNext = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(currentSlide + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = () => {
        localStorage.setItem('autoyield-onboarding-complete', 'true');
        setHasSeenOnboarding(true);
        onComplete();
    };

    if (hasSeenOnboarding) return null;

    const slide = slides[currentSlide];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background"
        >
            <div className="w-full max-w-md">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                        className="text-center"
                    >
                        {/* Branding / Visual */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.1, type: 'spring' }}
                            className={`mx-auto mb-8 w-24 h-24 rounded-3xl ${slide.bg} flex items-center justify-center border border-primary-600/20`}
                        >
                            <div className="w-12 h-12 bg-primary-600 rounded-xl" />
                        </motion.div>

                        {/* Title */}
                        <h1 className="text-3xl font-bold text-foreground mb-4 font-display">
                            {slide.title}
                        </h1>

                        {/* Description */}
                        <p className="text-lg text-muted mb-8 max-w-sm mx-auto">
                            {slide.description}
                        </p>
                    </motion.div>
                </AnimatePresence>

                {/* Progress Dots */}
                <div className="flex justify-center gap-2 mb-8">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${index === currentSlide
                                ? 'w-8 bg-primary-600'
                                : 'bg-secondary-300 dark:bg-secondary-700'
                                }`}
                        />
                    ))}
                </div>

                {/* Buttons */}
                <div className="flex gap-4">
                    {currentSlide < slides.length - 1 ? (
                        <>
                            <button
                                onClick={handleComplete}
                                className="flex-1 py-3 rounded-xl glass border border-foreground/10 text-muted font-medium hover:bg-foreground/5 transition-all"
                            >
                                Skip
                            </button>
                            <button
                                onClick={handleNext}
                                className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold hover:opacity-90 transition-all"
                            >
                                Next
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={handleComplete}
                            className="w-full py-4 rounded-xl bg-primary text-white font-semibold text-lg hover:opacity-90 transition-all shadow-lg"
                        >
                            Get Started
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
