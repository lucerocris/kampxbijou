import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lucerocris.sgp1.cdn.digitaloceanspaces.com', // The one causing the error
      },
      {
        protocol: 'https',
        hostname: 'lucerocris.sgp1.digitaloceanspaces.com', // The non-CDN fallback
      },
    ],
  },
};

export default nextConfig;
