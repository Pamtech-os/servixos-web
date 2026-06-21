import type { NextConfig } from 'next';

// NEXT_PUBLIC_API_BASE_URL must be a full URL (e.g. https://api-dev.servixos.com/api)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api-dev.servixos.com/api';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion'],
  },
  async rewrites() {
    return [
      {
        source: '/api-proxy/:path*',
        destination: `${API_BASE}/:path*`,
      },
    ];
  },
};

export default nextConfig;
