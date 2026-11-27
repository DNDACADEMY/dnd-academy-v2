import { join } from 'node:path';

import type { NextConfig } from 'next';

const storage = process.env.DND_SUPABASE_URL ? new URL(process.env.DND_SUPABASE_URL) : null;
const mediaCdn = process.env.DND_CMS_MEDIA_CDN_ORIGIN ? new URL(process.env.DND_CMS_MEDIA_CDN_ORIGIN) : null;

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
  async headers() {
    const headers = [
      { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
      { key: 'Referrer-Policy', value: 'no-referrer' },
      { key: 'Cache-Control', value: 'private, no-store' },
    ];
    return [
      { source: '/submit-content/:path*', headers },
      { source: '/api/submissions/:path*', headers },
    ];
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      ...(storage
        ? [
            {
              protocol: storage.protocol === 'http:' ? ('http' as const) : ('https' as const),
              hostname: storage.hostname,
              port: storage.port,
              pathname: '/storage/v1/object/public/cms-public/**',
            },
          ]
        : []),
      ...(mediaCdn
        ? [{ protocol: 'https' as const, hostname: mediaCdn.hostname, pathname: '/s3/cms/published/**' }]
        : []),
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
