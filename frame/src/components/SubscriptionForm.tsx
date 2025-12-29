'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function SubscriptionForm({
    onBack,
    onNext,
}: {
    onBack: () => void;
    onNext: () => void;
}) {
    const [amount, setAmount] = useState('10');
    const [customAmount, setCustomAmount] = useState('');
    const [selectedPreset, setSelectedPreset] = useState('10');

    const presets = [
        { value: '5', label: '$5', desc: 'Starter' },
        { value: '10', label: '$10', desc: 'Popular' },
        { value: '25', label: '$25', desc: 'Growth' },
        { value: '50', label: '$50', desc: 'Pro' },
    ];

    const handlePresetClick = (value: string) => {
        setSelectedPreset(value);
        setAmount(value);
        setCustomAmount('');
    };

    const handleCustomChange = (value: string) => {
        setCustomAmount(value);
        setAmount(value);
        setSelectedPreset('');
    };

    const projectedYield = parseFloat(amount || '0') * 365 * 0.125; // 12.5% APY

    return (
        <div className="space-y-6">
            {/* Preset Amounts */}
            <div>
                <label className="text-white font-semibold mb-3 block">Choose Preset Amount</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {presets.map((preset) => (
                        <button
                            key={preset.value}
                            onClick={() => handlePresetClick(preset.value)}
                            className={`p-4 rounded-xl transition-all ${selectedPreset === preset.value
                                    ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white scale-105'
                                    : 'glass text-white/70 hover:bg-white/20'
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
                <label className="text-white font-semibold mb-3 block">Or Enter Custom Amount</label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 text-xl">$</span>
                    <input
                        type="number"
                        value={customAmount}
                        onChange={(e) => handleCustomChange(e.target.value)}
                        placeholder="Enter amount..."
                        className="w-full pl-10 pr-20 py-4 rounded-xl glass-dark text-white text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500"
                        step="0.01"
                        min="1"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50">USDC</span>
                </div>
                <p className="text-white/50 text-sm mt-2">Minimum: $1 USDC per day</p>
            </div>

            {/* Projection */}
            <motion.div
                key={amount}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass rounded-2xl p-6 bg-gradient-to-r from-primary-500/10 to-accent-500/10 border border-primary-500/30"
            >
                <h3 className="text-white font-semibold mb-4">📊 Your Projected Returns</h3>
                <div className="space-y-3">
                    <div className="flex justify-between text-white/80">
                        <span>Daily Deposit</span>
                        <span className="font-semibold">${amount || '0'} USDC</span>
                    </div>
                    <div className="flex justify-between text-white/80">
                        <span>Monthly Total</span>
                        <span className="font-semibold">${(parseFloat(amount || '0') * 30).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-white/80">
                        <span>Yearly Total</span>
                        <span className="font-semibold">${(parseFloat(amount || '0') * 365).toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-white/20 my-2" />
                    <div className="flex justify-between text-white">
                        <span className="font-semibold">Est. Yield (12.5% APY)</span>
                        <span className="font-bold text-green-400 text-xl">
                            +${projectedYield.toFixed(2)}
                        </span>
                    </div>
                </div>
            </motion.div>

            {/* Actions */}
            <div className="flex gap-4">
                <button
                    onClick={onBack}
                    className="flex-1 py-4 rounded-xl glass hover:bg-white/20 text-white font-semibold transition-all"
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
