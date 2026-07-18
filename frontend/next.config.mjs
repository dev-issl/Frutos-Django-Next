/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    experimental: {
        staleTimes: {
            dynamic: 0,
            static: 30,
        },
        serverActions: {
            allowedOrigins: [
                'localhost:3000',
                '127.0.0.1:3000',
                '10.17.90.71',
                '10.17.90.71:3000',
                'frutos.athome.com.bd',
                // Production domains
                'elarbol.icommerce.com.bd',
                'www.elarbol.icommerce.com.bd',
            ]
        },
    },

    images: {
        unoptimized: true,
        remotePatterns: [
            // Local development
            {
                protocol: 'http',
                hostname: '10.17.90.71',
                port: '8000',
                pathname: '/media/**',
            },
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '8000',
                pathname: '/media/**',
            },
            {
                protocol: 'http',
                hostname: '127.0.0.1',
                port: '8000',
                pathname: '/media/**',
            },
            // Production — media served via nginx (no port needed)
            {
                protocol: 'https',
                hostname: 'elarbol.icommerce.com.bd',
                pathname: '/media/**',
            },
            {
                protocol: 'http',
                hostname: 'elarbol.icommerce.com.bd',
                pathname: '/media/**',
            },
            // Other
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: 'placehold.co',
            },
            {
                protocol: 'https',
                hostname: 'frutos.athome.com.bd',
                pathname: '/media/**',
            },
        ],
    },
}

export default nextConfig