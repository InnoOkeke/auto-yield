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
                // Secondary: Minimal Gray
                secondary: {
                    DEFAULT: '#64748B',
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748B',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                    950: '#020617',
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
                },
                // Theme-aware colors
                background: 'rgb(var(--background))',
                foreground: 'rgb(var(--foreground))',
                card: 'rgb(var(--card))',
                muted: 'rgb(var(--muted))',
            },
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
};

export default config;
