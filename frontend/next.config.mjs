/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api',
        NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || '127.0.0.1:8000',
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        NEXT_PUBLIC_REVALIDATE_SECRET: process.env.NEXT_PUBLIC_REVALIDATE_SECRET || 'elarbol_secret_2026',
    },
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
                'elarbolfrutal.es',
                'www.elarbolfrutal.es',
                'backend.elarbolfrutal.es',
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
                hostname: 'backend.elarbolfrutal.es',
                pathname: '/media/**',
            },
            {
                protocol: 'https',
                hostname: 'elarbolfrutal.es',
                pathname: '/media/**',
            },
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

    async redirects() {
        return [
            {
                source: '/admin/dashboard',
                destination: '/dashboard',
                permanent: false,
            },
            {
                source: '/admin/dashboard/:path*',
                destination: '/dashboard/:path*',
                permanent: false,
            },
            {
                source: '/admin',
                destination: '/dashboard',
                permanent: false,
            },
        ]
    },
}

export default nextConfig