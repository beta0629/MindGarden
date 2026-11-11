import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [390, 640, 768, 1024, 1280, 1440, 1920, 2560, 3840],
    imageSizes: [64, 96, 128, 256, 384, 640],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.mindgarden.co.kr',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'blogthumb.pstatic.net',
      },
      {
        protocol: 'https',
        hostname: '**.pstatic.net',
      },
    ],
  },
  async headers() {
    // Staging (and any non-indexable build) must send X-Robots-Tag.
    // Production sets NEXT_PUBLIC_SITE_INDEXABLE=true and skips this header.
    if (process.env.NEXT_PUBLIC_SITE_INDEXABLE === 'true') {
      return [];
    }
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/about/mindgarden',
        destination: '/about',
        permanent: true,
      },
      {
        source: '/values',
        destination: '/about',
        permanent: true,
      },
      {
        source: '/programs/target',
        destination: '/counseling',
        permanent: true,
      },
      {
        source: '/programs/symptoms',
        destination: '/counseling/overlapping-concerns',
        permanent: true,
      },
      {
        source: '/programs/treatment',
        destination: '/guide',
        permanent: true,
      },
      {
        source: '/programs/test',
        destination: '/guide',
        permanent: true,
      },
      {
        source: '/programs/adhd',
        destination: '/counseling',
        permanent: true,
      },
      {
        source: '/counseling/child-adolescent-adhd',
        destination: '/counseling/children-adolescents',
        permanent: true,
      },
      {
        source: '/counseling/adult-adhd',
        destination: '/counseling/adults',
        permanent: true,
      },
      {
        source: '/counseling/comorbidity',
        destination: '/counseling/overlapping-concerns',
        permanent: true,
      },
      {
        source: '/counseling/counseling-areas',
        destination: '/counseling/couples-family',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
