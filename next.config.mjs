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
            {
                protocol: 'https',
                hostname: 'img.clerk.com',
                pathname: '**',
            },
        ],
    },
    // Optimized for Vercel deployment
    poweredByHeader: false,
    // Configure allowed dev origins for development (allow all for Replit)
    // allowedDevOrigins: ['localhost', '127.0.0.1'], // Commented out for Replit compatibility
    // Configure experimental features
    experimental: {
        // Support for larger request bodies in Server Actions
        serverActions: {
            bodySizeLimit: '50mb',
        },
    },
    // External packages for server-side rendering
    serverExternalPackages: ['cloudinary', 'nodemailer'],
    // Security and API configuration headers
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'SAMEORIGIN',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
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
    // Vercel-specific optimizations
    env: {
        CUSTOM_KEY: process.env.CUSTOM_KEY,
    },
};

export default nextConfig;
