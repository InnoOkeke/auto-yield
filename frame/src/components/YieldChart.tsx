'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

interface YieldChartProps {
    yieldData?: {
        totalDeposited?: string;
        currentValue?: string;
        yieldEarned?: string;
    };
    historyData?: Array<{
        date: string;
        deposited: number;
        value: number;
    }>;
}

// Generate mock data based on current values
const generateMockData = (days: number, totalDeposited: number, currentValue: number) => {
    const data = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        // Simulate gradual deposit growth and yield accumulation
        const progress = (days - i) / days;
        const deposited = totalDeposited * progress * (0.7 + Math.random() * 0.3);
        const yieldGrowth = 1 + (progress * 0.08 * (0.8 + Math.random() * 0.4)); // Up to ~8% yield
        const value = deposited * yieldGrowth;

        data.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            deposited: Math.round(deposited * 100) / 100,
            value: Math.round(value * 100) / 100,
        });
    }

    // Ensure the last data point matches actual values
    if (data.length > 0) {
        data[data.length - 1] = {
            date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            deposited: totalDeposited,
            value: currentValue,
        };
    }

    return data;
};

export default function YieldChart({ yieldData, historyData }: YieldChartProps) {
    const [period, setPeriod] = useState<'7d' | '30d'>('7d');
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';

    // Parse yield data
    const totalDeposited = parseFloat(yieldData?.totalDeposited || '0');
    const currentValue = parseFloat(yieldData?.currentValue || '0');

    // Generate chart data
    const chartData = useMemo(() => {
        if (historyData && historyData.length > 0) {
            const days = period === '7d' ? 7 : 30;
            return historyData.slice(-days);
        }
        // Use mock data if no history provided
        const days = period === '7d' ? 7 : 30;
        return generateMockData(days, totalDeposited, currentValue);
    }, [period, historyData, totalDeposited, currentValue]);

    // Theme-aware colors
    const colors = {
        deposited: '#4F46E5', // primary-600
        value: '#818cf8', // primary-400
        grid: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.08)',
        text: isDark ? '#9CA3AF' : '#475569',
        tooltipBg: isDark ? '#111827' : '#FFFFFF',
        tooltipBorder: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 23, 42, 0.1)',
    };

    // Custom tooltip
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div
                    className="glass-dark rounded-xl p-3 shadow-lg border border-foreground/10"
                    style={{
                        background: colors.tooltipBg,
                        borderColor: colors.tooltipBorder,
                    }}
                >
                    <p className="text-sm font-semibold text-foreground mb-2">{label}</p>
                    <div className="space-y-1">
                        <p className="text-xs">
                            <span className="text-blue-500 dark:text-blue-400 font-medium">Deposited: </span>
                            <span className="text-foreground font-semibold">${payload[0]?.value?.toFixed(2)}</span>
                        </p>
                        <p className="text-xs">
                            <span className="text-purple-500 dark:text-purple-400 font-medium">Value: </span>
                            <span className="text-foreground font-semibold">${payload[1]?.value?.toFixed(2)}</span>
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-dark rounded-3xl p-6 border border-foreground/5 shadow-sm"
        >
            {/* Header with period toggle */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-foreground">Yield Performance</h2>
                </div>

                {/* Period Toggle */}
                <div className="flex bg-foreground/5 rounded-xl p-1 border border-foreground/10">
                    <button
                        onClick={() => setPeriod('7d')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${period === '7d'
                            ? 'bg-purple-500 text-white shadow-md'
                            : 'text-muted hover:text-foreground'
                            }`}
                    >
                        7 Days
                    </button>
                    <button
                        onClick={() => setPeriod('30d')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${period === '30d'
                            ? 'bg-purple-500 text-white shadow-md'
                            : 'text-muted hover:text-foreground'
                            }`}
                    >
                        30 Days
                    </button>
                </div>
            </div>

            {/* Legend */}
            <div className="flex gap-6 mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500 dark:bg-blue-400" />
                    <span className="text-xs font-medium text-muted">Deposited</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500 dark:bg-purple-400" />
                    <span className="text-xs font-medium text-muted">Current Value</span>
                </div>
            </div>

            {/* Chart */}
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                        <defs>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={colors.grid}
                            vertical={false}
                        />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: colors.text, fontSize: 11 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: colors.text, fontSize: 11 }}
                            tickFormatter={(value) => `$${value}`}
                            dx={-5}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="deposited"
                            stroke={colors.deposited}
                            strokeWidth={2}
                            fill="transparent"
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={colors.value}
                            strokeWidth={2}
                            fill="transparent"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-foreground/5">
                <div className="text-center">
                    <p className="text-xs text-muted font-medium">Total Deposited</p>
                    <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                        ${totalDeposited.toFixed(2)}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-muted font-medium">Current Value</p>
                    <p className="text-lg font-bold text-primary-500 dark:text-primary-300">
                        ${currentValue.toFixed(2)}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-muted font-medium">Yield Earned</p>
                    <p className="text-lg font-bold text-green-500 dark:text-green-400">
                        +${(currentValue - totalDeposited).toFixed(2)}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
