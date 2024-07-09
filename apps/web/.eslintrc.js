module.exports = {
  ignorePatterns: [
    'public/',
    '/.next',
    'storybook-static',
  ],
  extends: [
    '../../.eslintrc.js',
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
  rules: {},
};
