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
    // Development server configuration - allows all hosts for development environments
    webpack: (config, { dev }) => {
        if (dev) {
            config.devServer = {
                ...config.devServer,
                allowedHosts: 'all'
            };
        }
        return config;
    },
};

export default nextConfig;
