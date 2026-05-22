import baseConfig from '@dnd-academy/eslint-config';
import nextPlugin from '@next/eslint-plugin-next';
import cypress from 'eslint-plugin-cypress';
import storybook from 'eslint-plugin-storybook';

export default [
  ...baseConfig,
  {
    ignores: ['.next/**', '.storybook/**', 'storybook-static/**', 'next-env.d.ts'],
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
        rootDir: ['apps/web/'],
      },
    },
  },
  {
    files: ['cypress/**/*.{js,jsx,ts,tsx}'],
    ...cypress.configs.recommended,
  },
  ...storybook.configs['flat/recommended'],
  {
    files: ['**/*.stories.{ts,tsx}'],
    rules: {
      'storybook/no-renderer-packages': 'off',
    },
  },
];
