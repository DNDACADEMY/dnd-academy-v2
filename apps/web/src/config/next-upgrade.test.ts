import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const appRoot = path.resolve(__dirname, '../..');
const repoRoot = path.resolve(appRoot, '../..');

type NextConfig = {
  eslint?: unknown;
  webpack?: (config: WebpackConfig) => WebpackConfig;
};

type TurboConfig = {
  globalEnv?: string[];
  tasks?: Record<string, {
    env?: string[];
  }>;
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

const readJson = <T>(relativePath: string) => JSON.parse(
  fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'),
) as T;

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
  it('keeps both Next apps on the latest Storybook-compatible major line', () => {
    const webPackage = readPackageJson('apps/web');
    const adminPackage = readPackageJson('apps/admin');
    const uiPackage = readPackageJson('packages/ui');

    expect(webPackage.dependencies?.next).toBe('16.2.6');
    expect(webPackage.dependencies?.['@next/third-parties']).toBe('16.2.6');
    expect(webPackage.devDependencies?.['@next/env']).toBe('16.2.6');
    expect(webPackage.devDependencies?.['@next/eslint-plugin-next']).toBe('16.2.6');
    expect(adminPackage.dependencies?.next).toBe('16.2.6');
    expect(adminPackage.devDependencies?.['@next/eslint-plugin-next']).toBe('16.2.6');
    expect(uiPackage.devDependencies?.next).toBe('16.2.6');
    expect(webPackage.scripts.dev).not.toContain('--turbo');
    expect(adminPackage.scripts.dev).not.toContain('--turbo');
  });

  it('opts Next 16 builds into webpack while custom webpack behavior is still required', () => {
    const webPackage = readPackageJson('apps/web');
    const adminPackage = readPackageJson('apps/admin');

    expect(webPackage.scripts.dev).toContain('--webpack');
    expect(webPackage.scripts.build).toContain('next build --webpack');
    expect(adminPackage.scripts.dev).toContain('--webpack');
    expect(adminPackage.scripts.build).toContain('next build --webpack');
  });

  it('uses the Next 16 proxy file convention instead of deprecated middleware files', () => {
    const webProxy = fs.readFileSync(path.join(repoRoot, 'apps/web/src/proxy.ts'), 'utf8');
    const adminProxy = fs.readFileSync(path.join(repoRoot, 'apps/admin/src/proxy.ts'), 'utf8');

    expect(fs.existsSync(path.join(repoRoot, 'apps/web/src/middleware.ts'))).toBe(false);
    expect(fs.existsSync(path.join(repoRoot, 'apps/admin/src/middleware.ts'))).toBe(false);
    expect(webProxy).toContain('export function proxy');
    expect(adminProxy).toContain('const proxy = auth');
    expect(adminProxy).toContain('export default proxy');
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

  it('keeps Storybook and Chromatic on the Next 16 compatible Storybook 10 line', () => {
    const webPackage = readPackageJson('apps/web');
    const uiPackage = readPackageJson('packages/ui');
    const webStorybookMain = fs.readFileSync(path.join(repoRoot, 'apps/web/.storybook/main.ts'), 'utf8');
    const typographyDocs = fs.readFileSync(path.join(repoRoot, 'packages/ui/src/stories/Typography.mdx'), 'utf8');

    expect(webPackage.devDependencies).toMatchObject({
      '@chromatic-com/storybook': '5.2.1',
      '@storybook/addon-docs': '10.4.0',
      '@storybook/nextjs': '10.4.0',
      '@storybook/react': '10.4.0',
      'eslint-plugin-storybook': '10.4.0',
      storybook: '10.4.0',
    });
    expect(uiPackage.devDependencies).toMatchObject({
      '@storybook/addon-docs': '10.4.0',
      '@storybook/react': '10.4.0',
      'eslint-plugin-storybook': '10.4.0',
      storybook: '10.4.0',
    });
    [
      '@storybook/addon-essentials',
      '@storybook/addon-interactions',
      '@storybook/addon-links',
      '@storybook/blocks',
      '@storybook/test',
    ].forEach((removedPackage) => {
      expect(webPackage.devDependencies).not.toHaveProperty(removedPackage);
      expect(uiPackage.devDependencies).not.toHaveProperty(removedPackage);
      expect(webStorybookMain).not.toContain(removedPackage);
      expect(typographyDocs).not.toContain(removedPackage);
    });
    expect(webStorybookMain).toContain('@storybook/addon-docs');
    expect(webStorybookMain).toContain('createRequire(import.meta.url)');
    expect(webStorybookMain).toContain('fileURLToPath(import.meta.url)');
    expect(webStorybookMain).toContain('tsconfig.storybook.json');
    expect(webStorybookMain).toContain('stream: false');
    expect(webStorybookMain).toContain('canvas: false');
    expect(webStorybookMain).toContain('zlib: false');
    expect(webStorybookMain).not.toContain('__dirname');
    expect(typographyDocs).toContain('@storybook/addon-docs/blocks');
  });

  it('runs local and CI tooling on a Node version supported by Storybook 10', () => {
    const ciWorkflow = fs.readFileSync(path.join(repoRoot, '.github/workflows/ci.yml'), 'utf8');
    const miseConfig = fs.readFileSync(path.join(repoRoot, 'mise.toml'), 'utf8');
    const gettingStartedGuide = fs.readFileSync(path.join(repoRoot, 'docs/getting-started.md'), 'utf8');

    expect(ciWorkflow).toContain('DEFAULT_NODE_VERSION: "v22.12.0"');
    expect(miseConfig).toContain('node = "22.12.0"');
    expect(gettingStartedGuide).toContain('node --version    # v22.12.0');
  });

  it('declares app build env vars for Turborepo strict env mode', () => {
    const rootTurbo = readJson<TurboConfig>('turbo.json');
    const buildEnv = rootTurbo.tasks?.build?.env ?? [];
    const expectedBuildEnv = [
      'ADMIN_ORIGIN',
      'ALLOWED_EMAIL_ADDRESSES',
      'AUTH_GOOGLE_ID',
      'AUTH_GOOGLE_SECRET',
      'AUTH_SECRET',
      'BLOB_READ_WRITE_TOKEN',
      'CRON_SECRET',
      'DND_ACADEMY_V2_BLOB_READ_WRITE_TOKEN',
      'GOOGLE_CLIENT_EMAIL',
      'GOOGLE_PRIVATE_KEY',
      'NEXT_PUBLIC_CHANNEL_IO_PLUGIN_KEY',
      'NEXT_PUBLIC_GA_MEASUREMENT_ID',
      'NEXT_PUBLIC_ORIGIN',
      'NEXT_PUBLIC_THEME',
      'NEXT_PUBLIC_VERCEL_BLOB_HOST',
      'REVALIDATION_TOKEN',
      'WEB_ORIGIN',
    ];

    expect(buildEnv).toEqual([...buildEnv].sort());
    expect(new Set(buildEnv).size).toBe(buildEnv.length);
    expect(buildEnv).toEqual(expectedBuildEnv);
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
