import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { StorybookConfig } from '@storybook/nextjs';

const requirePackage = createRequire(import.meta.url);
const currentDir = dirname(fileURLToPath(import.meta.url));

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): string {
  return dirname(requirePackage.resolve(join(value, 'package.json')));
}

const config: StorybookConfig = {
  stories: [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../../../packages/ui/src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../../../packages/ui/src/**/*.mdx",
  ],
  addons: [
    getAbsolutePath('@storybook/addon-docs'),
    getAbsolutePath('@chromatic-com/storybook'),
  ],
  framework: {
    name: getAbsolutePath('@storybook/nextjs'),
    options: {
      nextConfigPath: resolve(currentDir, '../next.config.js'),
    },
  },
  webpackFinal: async (config) => {
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': resolve(currentDir, '../src'),
      };
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        stream: false,
        zlib: false,
      };
    }

    const imageRule = config.module?.rules?.find((rule) => {
      const test = (rule as { test: RegExp }).test;

      if (!test) {
        return false;
      }

      return test.test(".svg");
    }) as { exclude?: RegExp };

    if (imageRule) {
      imageRule.exclude = /\.svg$/;
    }

    config.module?.rules?.push({
      test: /\.svg$/,
      use: [{
        loader: '@svgr/webpack',
        options: {
          svgo: false,
          svgoConfig: {
            plugins: [{
              name: 'removeViewBox',
              active: false,
            }],
          },
        },
      }],
    },
    {
      test: /\module\.scss$/,
      use: [
        {
          loader: 'sass-loader',
          options: {
            additionalData: `@import '@dnd-academy/ui/styles';`,
            sassOptions: {
              includePaths: [join(currentDir, '..', '..', '..', 'packages', 'ui', 'src', 'styles')],
            },
          },
        },
      ],
      include: [
        resolve(currentDir, '../../../packages/ui'),
      ],
    });

    return config;
  },

  typescript: {
    check: true,
    checkOptions: {
      typescript: {
        configFile: resolve(currentDir, '../tsconfig.storybook.json'),
      },
    },
    reactDocgen: 'react-docgen-typescript',
  },
};
export default config;
