import baseConfig from '@dnd-academy/eslint-config';
import nextPlugin from '@next/eslint-plugin-next';

export default [
  ...baseConfig,
  {
    ignores: [
      '.next/**',
      'next-env.d.ts',
      'public/**',
    ],
  },
  {
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      '@next/next/no-html-link-for-pages': 'off',
    },
    settings: {
      next: {
        rootDir: ['apps/admin/'],
      },
    },
  },
];
