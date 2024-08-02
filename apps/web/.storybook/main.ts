import type { StorybookConfig } from "@storybook/nextjs";

import { join, dirname, resolve } from "path";

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, "package.json")));
}
const config: StorybookConfig = {
  stories: [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../../../packages/ui/src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../../../packages/ui/src/**/*.mdx",
  ],
  addons: [
    getAbsolutePath("@storybook/addon-links"),
    getAbsolutePath("@storybook/addon-essentials"),
    getAbsolutePath("@storybook/addon-interactions"),
    getAbsolutePath("@chromatic-com/storybook"),
  ],
  framework: {
    name: getAbsolutePath("@storybook/nextjs"),
    options: {
      nextConfigPath: resolve(__dirname, '../next.config.js'),
    },
  },
  webpackFinal: async (config) => {
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "@": resolve(__dirname, "../src"),
      };
    }

    const imageRule = config.module?.rules?.find((rule) => {
      const test = (rule as { test: RegExp }).test;

      if (!test) {
        return false;
      }

      return test.test(".svg");
    }) as { [key: string]: any };

    imageRule.exclude = /\.svg$/;

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
              includePaths: [join(__dirname, '..', '..', '..', 'packages', 'ui', 'src', 'styles')],
            },
          },
        },
      ],
      include: [
        resolve(__dirname, '../../../packages/ui'),
      ],
    });

    return config;
  },

  typescript: {
    check: true,
    reactDocgen: "react-docgen-typescript"
  }
};
export default config;
