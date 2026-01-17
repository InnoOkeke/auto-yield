/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
            { protocol: 'https', hostname: 'i.imgur.com' },
            { protocol: 'https', hostname: 'imagedelivery.net' },
            { protocol: 'https', hostname: 'i.seadn.io' },
            { protocol: 'https', hostname: 'warpcast.com' },
            { protocol: 'https', hostname: '*.warpcast.com' },
            { protocol: 'https', hostname: 'res.cloudinary.com' },
            { protocol: 'https', hostname: '*.farcaster.xyz' },
            { protocol: 'https', hostname: 'openseauserdata.com' },
        ],
    },
    async headers() {
        return [
            {
                source: '/api/:path*',
                headers: [
                    { key: 'Access-Control-Allow-Origin', value: '*' },
                    { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
                    { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
                ],
            },
            {
                source: '/.well-known/:path*',
                headers: [
                    { key: 'Access-Control-Allow-Origin', value: '*' },
                    { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS' },
                    { key: 'Content-Type', value: 'application/json' },
                ],
            },
        ];
    },
    webpack: (config) => {
        config.externals.push('pino-pretty', 'lokijs', 'encoding');
        return config;
    },
};

module.exports = nextConfig;
