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
    includePaths: [path.join(__dirname, 'styles'), path.join(__dirname, '..', '..', 'packages', 'ui', 'src', 'styles')],
    additionalData: "@import '@dnd-academy/ui/styles';",
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
  webpack(config) {
    const fileLoaderRule = config.module.rules.find((rule) => rule.test?.test?.('.svg'));

    // eslint-disable-next-line no-param-reassign
    config.resolve.alias.canvas = false;

    config.module.rules.push(
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/, // *.svg?url
      },
      {
        test: /\.svg$/i,
        issuer: fileLoaderRule.issuer,
        resourceQuery: { not: [...fileLoaderRule.resourceQuery.not, /url/] }, // exclude if *.svg?url
        use: ['@svgr/webpack'],
      },
    );

    fileLoaderRule.exclude = /\.svg$/i;

    return config;
  },

};

module.exports = nextConfig;
