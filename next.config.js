const path = require('path');

const isProd = process.env.NODE_ENV === 'production';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'standalone',
  compiler: {
    reactRemoveProperties: isProd && {
      properties: ['^data-test'],
    },
    removeConsole: isProd,
  },
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dnd-academy-v3.s3.ap-northeast-2.amazonaws.com',
      },
    ],
  },
  swcMinify: true,
  experimental: {
    typedRoutes: true,
  },
};

module.exports = nextConfig;
