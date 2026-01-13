'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function SubscriptionForm({
    onBack,
    onNext,
    apy = 9.45,
    amount,
    onChange,
}: {
    onBack: () => void;
    onNext: () => void;
    apy?: number;
    amount: string;
    onChange: (val: string) => void;
}) {
    const [customAmount, setCustomAmount] = useState('');
    const [selectedPreset, setSelectedPreset] = useState(amount);

    const presets = [
        { value: '5', label: '$5', desc: 'Starter' },
        { value: '10', label: '$10', desc: 'Popular' },
        { value: '25', label: '$25', desc: 'Growth' },
        { value: '50', label: '$50', desc: 'Pro' },
    ];

    const handlePresetClick = (value: string) => {
        setSelectedPreset(value);
        onChange(value);
        setCustomAmount('');
    };

    const handleCustomChange = (value: string) => {
        setCustomAmount(value);
        onChange(value);
        setSelectedPreset('');
    };
    const projectedYield = parseFloat(amount || '0') * 365 * (apy / 100);

    return (
        <div className="space-y-6">
            {/* Preset Amounts */}
            <div>
                <label className="text-foreground font-semibold mb-3 block">Choose Preset Amount</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {presets.map((preset) => (
                        <button
                            key={preset.value}
                            onClick={() => handlePresetClick(preset.value)}
                            className={`p-4 rounded-xl transition-all ${selectedPreset === preset.value
                                ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white scale-105 shadow-lg'
                                : 'glass text-muted hover:bg-black/5 dark:hover:bg-white/20'
                                }`}
                        >
                            <div className="text-2xl font-bold">{preset.label}</div>
                            <div className="text-xs mt-1">{preset.desc}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Custom Amount */}
            <div>
                <label className="text-foreground font-semibold mb-3 block">Or Enter Custom Amount</label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-xl">$</span>
                    <input
                        type="number"
                        value={customAmount}
                        onChange={(e) => handleCustomChange(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-10 pr-20 py-4 rounded-xl glass-dark text-foreground text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 bg-background"
                        step="0.01"
                        min="1"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted">USDC</span>
                </div>
                <p className="text-muted text-sm mt-2">Minimum: $1 USDC per day</p>
            </div>

            {/* Projection */}
            <motion.div
                key={amount}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass rounded-2xl p-6 bg-gradient-to-r from-primary-500/10 to-accent-500/10 border border-primary-500/30"
            >
                <h3 className="text-foreground font-semibold mb-4">📊 Your Projected Returns</h3>
                <div className="space-y-3">
                    <div className="flex justify-between text-muted">
                        <span>Daily Deposit</span>
                        <span className="font-semibold text-foreground">${amount || '0'} USDC</span>
                    </div>
                    <div className="flex justify-between text-muted">
                        <span>Monthly Total</span>
                        <span className="font-semibold text-foreground">${(parseFloat(amount || '0') * 30).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-muted">
                        <span>Yearly Total</span>
                        <span className="font-semibold text-foreground">${(parseFloat(amount || '0') * 365).toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-foreground/10 my-2" />
                    <div className="flex justify-between text-foreground">
                        <span className="font-semibold">Est. Yield ({apy}% APY)</span>
                        <span className="font-bold text-green-500 dark:text-green-400 text-xl">
                            +${projectedYield.toFixed(2)}
                        </span>
                    </div>
                </div>
            </motion.div>

            {/* Actions */}
            <div className="flex gap-4">
                <button
                    onClick={onBack}
                    className="flex-1 py-4 rounded-xl glass hover:bg-black/5 dark:hover:bg-white/20 text-foreground font-semibold transition-all border border-foreground/5 shadow-sm"
                >
                    Back
                </button>
                <button
                    onClick={onNext}
                    disabled={!amount || parseFloat(amount) < 1}
                    className="flex-1 py-4 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Continue
                </button>
            </div>
        </div>
    );
}
