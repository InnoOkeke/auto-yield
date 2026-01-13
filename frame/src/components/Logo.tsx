'use client';

export default function Logo({ className = "w-10 h-10" }: { className?: string }) {
    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            <svg
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full text-primary-600 dark:text-white transition-colors duration-300"
            >
                {/* Background Shape */}
                <rect
                    x="10" y="10" width="80" height="80" rx="20"
                    className="fill-primary-600/5 dark:fill-white/10"
                />

                {/* Automation Loop Symbol (Stylized Infinity) */}
                <path
                    d="M35 50C35 41.7157 41.7157 35 50 35C58.2843 35 65 41.7157 65 50C65 58.2843 58.2843 65 50 65C41.7157 65 35 58.2843 35 50Z"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    className="opacity-90"
                />

                {/* Flow Indicators (Arrows) */}
                <path
                    d="M50 35L55 30M50 35L55 40"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M50 65L45 60M50 65L45 70"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Central Dot */}
                <circle cx="50" cy="50" r="4" fill="currentColor" />
            </svg>
        </div>
    );
}
