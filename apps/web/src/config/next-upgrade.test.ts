import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const appRoot = path.resolve(__dirname, '../..');
const repoRoot = path.resolve(appRoot, '../..');

type NextConfig = {
  eslint?: unknown;
  webpack?: (config: WebpackConfig) => WebpackConfig;
};

type SvgRule = {
  exclude?: RegExp;
  issuer: unknown;
  resourceQuery: {
    not: RegExp[];
  };
  test: RegExp;
};

type WebpackConfig = {
  module: {
    rules: SvgRule[];
  };
  resolve: {
    alias: Record<string, unknown>;
  };
};

const readPackageJson = (workspace: string) => JSON.parse(
  fs.readFileSync(path.join(repoRoot, workspace, 'package.json'), 'utf8'),
) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  resolutions?: Record<string, string>;
  scripts: Record<string, string>;
};

const loadNextConfig = async (workspace: string) => {
  const configModule = await import(pathToFileURL(path.join(repoRoot, workspace, 'next.config.js')).href);

  return configModule.default as NextConfig;
};

const createWebpackConfig = () => {
  const svgRule: SvgRule = {
    test: /\.(png|jpg|jpeg|gif|svg)$/i,
    issuer: { and: [/\.[jt]sx?$/] },
    resourceQuery: { not: [/url/] },
  };
  const config: WebpackConfig = {
    resolve: {
      alias: {},
    },
    module: {
      rules: [svgRule],
    },
  };

  return { config, svgRule };
};

describe('Next upgrade guardrails', () => {
  it('keeps both Next apps on the latest Storybook-compatible backport line', () => {
    const webPackage = readPackageJson('apps/web');
    const adminPackage = readPackageJson('apps/admin');

    expect(webPackage.dependencies?.next).toBe('15.5.18');
    expect(adminPackage.dependencies?.next).toBe('15.5.18');
    expect(webPackage.scripts.dev).not.toContain('--turbo');
    expect(webPackage.scripts.dev).not.toContain('--webpack');
    expect(webPackage.scripts.build).not.toContain('--webpack');
    expect(adminPackage.scripts.dev).not.toContain('--turbo');
    expect(adminPackage.scripts.dev).not.toContain('--webpack');
    expect(adminPackage.scripts.build).not.toContain('--webpack');
  });

  it('does not keep the removed Next eslint build option', async () => {
    const webNextConfig = await loadNextConfig('apps/web');
    const adminNextConfig = await loadNextConfig('apps/admin');

    expect(webNextConfig).not.toHaveProperty('eslint');
    expect(adminNextConfig).not.toHaveProperty('eslint');
  });

  it('keeps the SVG and canvas webpack behavior that the apps depend on', async () => {
    const configs = [
      await loadNextConfig('apps/web'),
      await loadNextConfig('apps/admin'),
    ];

    configs.forEach((nextConfig) => {
      const { config, svgRule } = createWebpackConfig();
      const result = nextConfig.webpack?.(config);

      expect(result?.resolve.alias.canvas).toBe(false);
      expect(svgRule.exclude).toEqual(/\.svg$/i);
      expect(result?.module.rules).toEqual(expect.arrayContaining([
        expect.objectContaining({
          test: /\.svg$/i,
          resourceQuery: /url/,
        }),
        expect.objectContaining({
          test: /\.svg$/i,
          issuer: svgRule.issuer,
          resourceQuery: { not: [/url/, /url/] },
          use: ['@svgr/webpack'],
        }),
      ]));
    });
  });

  it('does not keep the unused Codecov webpack plugin in the app bundle config', () => {
    const webPackage = readPackageJson('apps/web');

    expect(webPackage.dependencies).not.toHaveProperty('@codecov/nextjs-webpack-plugin');
    expect(webPackage.devDependencies).not.toHaveProperty('@codecov/nextjs-webpack-plugin');
  });

  it('pins audited transitive toolchain packages to patched versions', () => {
    const rootPackage = readPackageJson('.');

    expect(rootPackage.resolutions).toMatchObject({
      '@babel/preset-env': '7.29.5',
      '@babel/plugin-transform-modules-systemjs': '7.29.4',
      '@babel/runtime': '7.29.2',
      'ajv@npm:^8.0.0': '8.20.0',
      'ajv@npm:^8.0.1': '8.20.0',
      'ajv@npm:^8.9.0': '8.20.0',
      'ajv@npm:^8.11.0': '8.20.0',
      'brace-expansion@npm:^1.1.7': '1.1.14',
      'brace-expansion@npm:^1.1.11': '1.1.14',
      'glob@npm:^10.3.10': '10.5.0',
      'ip-address': '10.2.0',
      'js-yaml@npm:^3.13.1': '3.14.2',
      'js-yaml@npm:^4.1.0': '4.1.1',
      'node-gyp': '12.3.0',
      'picomatch@npm:^2.0.4': '2.3.2',
      'picomatch@npm:^2.2.1': '2.3.2',
      'picomatch@npm:^2.2.3': '2.3.2',
      'picomatch@npm:^2.3.1': '2.3.2',
      'yaml@npm:^1.10.0': '1.10.3',
    });
  });
});
