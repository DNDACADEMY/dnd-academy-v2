module.exports = {
  ignorePatterns: [
    '/.next',
    'storybook-static',
  ],
  extends: [
    '@dnd-academy/eslint-config',
    'plugin:@next/next/recommended',
  ],
  settings: {
    'import/resolver': {
      alias: {
        map: [['@', './src']],
        extensions: ['.ts', '.js', '.tsx', '.json', '.css'],
      },
    },
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
    },
    {
      extends: ['plugin:cypress/recommended'],
      files: ['cypress/**/*.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: ['./cypress/tsconfig.json'],
      },
    },
    {
      extends: ['plugin:storybook/recommended'],
      files: ['**/*.stories.ts?(x)'],
      rules: {},
    },
  ],
  rules: {
    'import/no-extraneous-dependencies': ['error', {
      devDependencies: ['**/*.test.ts', '**/*.test.tsx', '**/*.stories.tsx', '**/*.stories.ts', 'next.config.js', 'scripts/**/*.ts'],
    }],
  },
};
