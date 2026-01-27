'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { TrendingUp, Banknote, BarChart3, Sparkles } from 'lucide-react';

interface AutoIncreaseCardProps {
    address: string;
}

interface AutoIncreaseSettings {
    enabled: boolean;
    type: 'FIXED' | 'PERCENTAGE' | null;
    amount: string | null;
    intervalDays: number | null;
    maxAmount: string | null;
    lastIncreaseAt: string | null;
    nextIncreaseDate: string | null;
    currentDailyAmount: string;
}

export default function AutoIncreaseCard({ address }: AutoIncreaseCardProps) {
    const [settings, setSettings] = useState<AutoIncreaseSettings | null>(null);
    const [enabled, setEnabled] = useState(false);
    const [type, setType] = useState<'FIXED' | 'PERCENTAGE'>('FIXED');
    const [amount, setAmount] = useState('0.50');
    const [maxAmount, setMaxAmount] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Fetch current settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await axios.get(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/subscription/auto-increase/${address}`
                );
                setSettings(response.data);
                setEnabled(response.data.enabled);
                if (response.data.type) setType(response.data.type);
                if (response.data.amount) setAmount(response.data.amount);
                if (response.data.maxAmount) setMaxAmount(response.data.maxAmount);
            } catch (error) {
                console.error('Failed to fetch auto-increase settings:', error);
            } finally {
                setLoading(false);
            }
        };

        if (address) {
            fetchSettings();
        }
    }, [address]);

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);

        try {
            const response = await axios.put(
                `${process.env.NEXT_PUBLIC_API_URL}/api/subscription/auto-increase/${address}`,
                {
                    enabled,
                    type: enabled ? type : null,
                    amount: enabled ? amount : null,
                    intervalDays: 30,
                    maxAmount: maxAmount || null,
                }
            );

            setMessage({ type: 'success', text: response.data.message });

            // Clear message after 3 seconds
            setTimeout(() => setMessage(null), 3000);
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.response?.data?.error || 'Failed to save settings',
            });
        } finally {
            setSaving(false);
        }
    };

    // Calculate preview of next amount
    const previewNextAmount = () => {
        const current = parseFloat(settings?.currentDailyAmount || '0');
        const increaseAmount = parseFloat(amount || '0');

        if (type === 'FIXED') {
            return (current + increaseAmount).toFixed(2);
        } else {
            return (current * (1 + increaseAmount / 100)).toFixed(2);
        }
    };

    if (loading) {
        return (
            <div className="glass-dark rounded-3xl p-6 border border-foreground/10 animate-pulse">
                <div className="h-6 bg-foreground/10 rounded w-1/3 mb-4" />
                <div className="h-4 bg-foreground/10 rounded w-2/3" />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-dark rounded-3xl p-6 border border-foreground/10 shadow-lg"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary-600/10 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-foreground uppercase tracking-widest leading-none mb-1">Scale Plan</h3>
                        <p className="text-[10px] text-secondary-500 font-bold uppercase tracking-widest">Compounding Growth</p>
                    </div>
                </div>

                {/* Premium Badge */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600/10 text-primary-600 dark:text-primary-400 border border-primary-600/20">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Premium</span>
                </div>
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-foreground/5 border border-foreground/5 mb-4">
                <div>
                    <p className="font-medium text-foreground">Enable Auto-Increase</p>
                    <p className="text-xs text-muted">Automatically grow your daily savings amount</p>
                </div>
                <button
                    onClick={() => setEnabled(!enabled)}
                    className={`relative w-14 h-8 rounded-full transition-all duration-300 ${enabled
                        ? 'bg-primary'
                        : 'bg-foreground/20'
                        }`}
                >
                    <motion.div
                        animate={{ x: enabled ? 24 : 4 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
                    />
                </button>
            </div>

            {/* Settings (shown when enabled) */}
            {enabled && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                >
                    {/* Type Selection */}
                    <div>
                        <label className="text-[10px] font-black text-secondary-500 uppercase tracking-widest mb-3 block">Strategy Type</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => {
                                    setType('FIXED');
                                    setAmount('0.50');
                                }}
                                className={`p-5 rounded-2xl border-2 transition-all text-left group ${type === 'FIXED'
                                    ? 'border-primary-500 bg-primary-500/5'
                                    : 'border-foreground/5 bg-foreground/5 hover:border-foreground/10'
                                    }`}
                            >
                                <Banknote className={`w-5 h-5 mb-3 transition-colors ${type === 'FIXED' ? 'text-primary-500' : 'text-secondary-500'}`} />
                                <p className="font-black text-foreground uppercase tracking-widest text-xs mb-1">Fixed</p>
                                <p className="text-[10px] text-secondary-500 font-bold uppercase tracking-widest">+$0.50 / period</p>
                            </button>
                            <button
                                onClick={() => {
                                    setType('PERCENTAGE');
                                    setAmount('5');
                                }}
                                className={`p-5 rounded-2xl border-2 transition-all text-left group ${type === 'PERCENTAGE'
                                    ? 'border-primary-500 bg-primary-500/5'
                                    : 'border-foreground/5 bg-foreground/5 hover:border-foreground/10'
                                    }`}
                            >
                                <BarChart3 className={`w-5 h-5 mb-3 transition-colors ${type === 'PERCENTAGE' ? 'text-primary-500' : 'text-secondary-500'}`} />
                                <p className="font-black text-foreground uppercase tracking-widest text-xs mb-1">Percentage</p>
                                <p className="text-[10px] text-secondary-500 font-bold uppercase tracking-widest">+5% / period</p>
                            </button>
                        </div>
                    </div>

                    {/* Amount Input */}
                    <div>
                        <label className="text-sm font-medium text-muted mb-2 block">
                            {type === 'FIXED' ? 'Increase Amount ($)' : 'Increase Percentage (%)'}
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-medium">
                                {type === 'FIXED' ? '$' : ''}
                            </span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                min="0.01"
                                max={type === 'PERCENTAGE' ? '100' : '1000'}
                                step={type === 'FIXED' ? '0.10' : '1'}
                                className={`w-full py-3 rounded-xl glass border border-foreground/10 text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary ${type === 'FIXED' ? 'pl-8 pr-4' : 'px-4'
                                    }`}
                            />
                            {type === 'PERCENTAGE' && (
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted font-medium">
                                    %
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Max Amount (Optional) */}
                    <div>
                        <label className="text-sm font-medium text-muted mb-2 block">
                            Max Daily Amount (Optional)
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-medium">$</span>
                            <input
                                type="number"
                                value={maxAmount}
                                onChange={(e) => setMaxAmount(e.target.value)}
                                placeholder="No limit"
                                min="0"
                                step="1"
                                className="w-full pl-8 pr-4 py-3 rounded-xl glass border border-foreground/10 text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted/50"
                            />
                        </div>
                        <p className="text-xs text-muted mt-1">Cap your daily amount so it never exceeds this</p>
                    </div>

                    {/* Preview */}
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                        <p className="text-xs text-muted mb-1">Preview: Next increase</p>
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-foreground">
                                ${settings?.currentDailyAmount}
                            </span>
                            <span className="text-primary">→</span>
                            <span className="text-lg font-bold text-primary">
                                ${previewNextAmount()}
                            </span>
                            <span className="text-xs text-muted ml-auto">every 30 days</span>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Status Message */}
            {message && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-4 p-3 rounded-xl text-sm font-medium ${message.type === 'success'
                        ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                        : 'bg-red-500/10 text-red-500 border border-red-500/20'
                        }`}
                >
                    {message.text}
                </motion.div>
            )}

            {/* Save Button */}
            <button
                onClick={handleSave}
                disabled={saving}
                className="w-full mt-4 py-3 rounded-xl bg-primary text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {saving ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                    </>
                ) : (
                    'Save Settings'
                )}
            </button>

            {/* Info */}
            <p className="text-xs text-muted text-center mt-3">
                {enabled
                    ? `Your daily savings will increase by ${type === 'FIXED' ? `$${amount}` : `${amount}%`} every 30 days`
                    : 'Enable to automatically grow your savings over time'}
            </p>
        </motion.div>
    );
}
