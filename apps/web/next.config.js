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
  webpack(config) {
    const fileLoaderRule = config.module.rules.find((rule) => rule.test?.test?.('.svg'));

    // Tell Next.js's bundled webpack to skip the `canvas` native module.
    // pdfjs-dist (via react-pdf) lists it as an optionalDependency; we also
    // replace it with a no-op portal at the root resolutions level
    // (see __stubs__/canvas/). Both layers are needed: this alias covers
    // the runtime bundle, the portal covers `yarn install`.
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

    // if (!options.dev) {
    //   config.plugins.push(
    //     codecovNextJSWebpackPlugin({
    //       enableBundleAnalysis: true,
    //       bundleName: '@dnd-academy/web',
    //       uploadToken: process.env.CODECOV_TOKEN,
    //       webpack: options.webpack,
    //     }),
    //   );
    // }

    return config;
  },

};

module.exports = nextConfig;
