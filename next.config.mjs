/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
                pathname: '**',
            },
            {
                protocol: 'https',
                hostname: 'raw.githubusercontent.com',
                pathname: '**',
            },
        ],
    },
    // Configure for Replit environment - use hostname allowlist in webpack config
    webpack: (config, { dev }) => {
        if (dev) {
            config.devServer = {
                ...config.devServer,
                allowedHosts: 'all'
            };
        }
        return config;
    },
    // Standalone output for production deployment
    output: 'standalone',
    // Allow iframe embedding for Replit preview
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'Content-Security-Policy',
                        value: "frame-ancestors 'self' https://*.replit.com https://*.replit.dev",
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
