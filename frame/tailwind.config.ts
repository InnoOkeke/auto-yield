import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Primary: Deep Indigo
                primary: {
                    DEFAULT: '#4F46E5',
                    50: '#eef2ff',
                    100: '#e0e7ff',
                    200: '#c7d2fe',
                    300: '#a5b4fc',
                    400: '#818cf8',
                    500: '#6366f1',
                    600: '#4F46E5', // Main Brand Colour
                    700: '#4338ca',
                    800: '#3730a3',
                    900: '#312e81',
                    950: '#1e1b4b',
                },
                // Secondary: Soft Cyan
                secondary: {
                    DEFAULT: '#22D3EE',
                    50: '#ecfeff',
                    100: '#cffafe',
                    200: '#a5f3fc',
                    300: '#67e8f9',
                    400: '#22D3EE', // Accent / highlights
                    500: '#06b6d4',
                    600: '#0891b2',
                    700: '#0e7490',
                    800: '#155e75',
                    900: '#164e63',
                    950: '#083344',
                },
                // Success: Emerald Green
                success: {
                    DEFAULT: '#10B981',
                    500: '#10B981',
                },
                // Warning: Amber
                warning: {
                    DEFAULT: '#F59E0B',
                    500: '#F59E0B',
                },
                // Error: Rose Red
                error: {
                    DEFAULT: '#F43F5E',
                    500: '#F43F5E',
                },
                // Dark Mode Backgrounds
                dark: {
                    bg: '#0B1020', // Very dark navy
                    card: '#111827', // Dark slate
                    border: 'rgba(255, 255, 255, 0.06)',
                },
                // Light Mode Backgrounds
                light: {
                    bg: '#F8FAFC', // Soft off-white
                    card: '#FFFFFF', // Pure white
                    border: 'rgba(11, 16, 32, 0.08)',
                }
            },
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
            },
            backgroundImage: {
                'gradient-signature': 'linear-gradient(135deg, #4F46E5 0%, #22D3EE 100%)',
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
            },
        },
    },
    plugins: [],
};

export default config;
