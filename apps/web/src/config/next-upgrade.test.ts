import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

import type { NextConfig } from 'next';

const appRoot = path.resolve(import.meta.dirname, '../..');
const repoRoot = path.resolve(appRoot, '../..');

type TurboConfig = {
  globalEnv?: string[];
  tasks?: Record<
    string,
    {
      env?: string[];
    }
  >;
};

const readPackageJson = (workspace: string) =>
  JSON.parse(fs.readFileSync(path.join(repoRoot, workspace, 'package.json'), 'utf8')) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    engines?: { node?: string };
    scripts: Record<string, string>;
  };

const readJson = <T>(relativePath: string) =>
  JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')) as T;

const loadNextConfig = async (workspace: string) => {
  const configModule = await import(pathToFileURL(path.join(repoRoot, workspace, 'next.config.mts')).href);

  return configModule.default as NextConfig;
};

describe('Next upgrade guardrails', () => {
  it('keeps both Next apps on the latest Storybook-compatible major line', () => {
    const webPackage = readPackageJson('apps/web');
    const adminPackage = readPackageJson('apps/admin');
    const uiPackage = readPackageJson('packages/ui');

    expect(webPackage.dependencies?.next).toBe('16.4.1');
    expect(webPackage.dependencies?.['@next/third-parties']).toBe('16.4.1');
    expect(webPackage.devDependencies?.['@next/env']).toBe('16.4.1');
    expect(adminPackage.dependencies?.next).toBe('16.4.1');
    expect(uiPackage.devDependencies?.next).toBe('16.4.1');
  });

  it.each(['apps/web', 'apps/admin'])('uses Turbopack in development and production for %s', (workspace) => {
    const { scripts } = readPackageJson(workspace);

    expect(scripts.dev).toContain('next dev --turbopack');
    expect(scripts.build).toContain('next build --turbopack');
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

  it.each(['apps/web', 'apps/admin'])('preserves SVG URL imports and skips native canvas for %s', async (workspace) => {
    const { turbopack } = await loadNextConfig(workspace);

    expect(turbopack?.rules?.['*.svg']).toEqual({
      condition: { not: { query: /url/ } },
      loaders: ['@svgr/webpack'],
      as: '*.js',
    });
    expect(turbopack?.resolveAlias?.canvas).toBe(false);
    expect(readPackageJson(workspace).devDependencies).toHaveProperty('@svgr/webpack');
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
      '@storybook/addon-docs': '10.6.2',
      '@storybook/nextjs': '10.6.2',
      '@storybook/react': '10.6.2',
      storybook: '10.6.2',
    });
    expect(uiPackage.devDependencies).toMatchObject({
      '@storybook/addon-docs': '10.6.2',
      '@storybook/react': '10.6.2',
      storybook: '10.6.2',
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

  it('uses Node 26 LTS for local tooling, CI and both Vercel apps', () => {
    const ciWorkflow = fs.readFileSync(path.join(repoRoot, '.github/workflows/ci.yml'), 'utf8');
    const miseConfig = fs.readFileSync(path.join(repoRoot, 'mise.toml'), 'utf8');
    const gettingStartedGuide = fs.readFileSync(path.join(repoRoot, 'docs/getting-started.md'), 'utf8');

    expect(ciWorkflow).toContain('DEFAULT_NODE_VERSION: "v26.13.1"');
    expect(miseConfig).toContain('node = "26.13.1"');
    expect(gettingStartedGuide).toContain('node --version    # v26.13.1');
    for (const workspace of ['.', 'apps/web', 'apps/admin']) {
      expect(readPackageJson(workspace).engines?.node).toBe('26.x');
    }
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
    const workspaceConfig = fs.readFileSync(path.join(repoRoot, 'pnpm-workspace.yaml'), 'utf8');
    const pinnedOverrides = {
      '@babel/preset-env': '7.29.5',
      '@babel/plugin-transform-modules-systemjs': '7.29.4',
      '@babel/runtime': '7.29.2',
      'ajv@^8.0.0': '8.20.0',
      'ajv@^8.0.1': '8.20.0',
      'ajv@^8.9.0': '8.20.0',
      'ajv@^8.11.0': '8.20.0',
      'brace-expansion@^1.1.7': '1.1.21',
      'brace-expansion@^1.1.11': '1.1.21',
      'glob@^10.3.10': '10.5.0',
      'ip-address': '10.2.0',
      'js-yaml@^3.13.1': '3.14.2',
      'js-yaml@^4.1.0': '4.3.2',
      'node-gyp': '12.3.0',
      'picomatch@^2.0.4': '2.3.2',
      'picomatch@^2.2.1': '2.3.2',
      'picomatch@^2.2.3': '2.3.2',
      'picomatch@^2.3.1': '2.3.2',
      'yaml@^1.10.0': '1.10.3',
    };

    Object.entries(pinnedOverrides).forEach(([selector, version]) => {
      expect(workspaceConfig).toMatch(
        new RegExp(`^  "?${selector.replace(/[.*+?^$()|[\]\\]/g, '\\$&')}"?: "${version}"$`, 'm'),
      );
    });
  });
});
