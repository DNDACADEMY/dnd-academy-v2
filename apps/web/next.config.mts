import { join } from 'node:path';

import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  compiler: {
    reactRemoveProperties: isProd && {
      properties: ['^data-test'],
    },
    removeConsole: isProd,
  },
  sassOptions: {
    includePaths: [
      join(import.meta.dirname, 'styles'),
      join(import.meta.dirname, '..', '..', 'packages', 'ui', 'src', 'styles'),
    ],
    additionalData: "@use '@dnd-academy/ui/styles' as *;",
  },
  async redirects() {
    return [
      {
        source: '/dnd',
        destination: '/dnd/about',
        permanent: true,
      },
    ];
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dnd-academy-v3.s3.ap-northeast-2.amazonaws.com',
      },
    ],
  },
  typedRoutes: true,
  turbopack: {
    rules: {
      '*.svg': {
        condition: { not: { query: /url/ } },
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
    resolveAlias: { canvas: false },
  },
};

export default nextConfig;
