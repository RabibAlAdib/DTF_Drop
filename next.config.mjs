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
    // Configure allowed dev origins and other experimental features
    experimental: {
        allowedDevOrigins: ['localhost', '127.0.0.1', '*.replit.dev'],
        // Support for larger request bodies in Server Actions
        serverActions: {
            bodySizeLimit: '50mb',
        },
    },
    // Move serverComponentsExternalPackages to root level as required by Next.js 15+
    serverExternalPackages: ['cloudinary'],
    // Allow iframe embedding for Replit preview and configure API route limits
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
            {
                // Configure headers for API routes to handle large uploads
                source: '/api/:path*',
                headers: [
                    {
                        key: 'Access-Control-Max-Age',
                        value: '86400',
                    },
                    {
                        key: 'Access-Control-Allow-Methods',
                        value: 'GET, POST, PUT, DELETE, OPTIONS',
                    },
                    {
                        key: 'Access-Control-Allow-Headers',
                        value: 'Content-Type, Authorization',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
