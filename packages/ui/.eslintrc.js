module.exports = {
  extends: [
    '@dnd-academy/eslint-config',
  ],
  settings: {
    'import/resolver': {
      alias: {
        map: [['@', './src']],
        extensions: ['.ts', '.js', '.tsx', '.json'],
      },
    },
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: [
          './tsconfig.jest.json',
          './tsconfig.json',
        ],
        tsconfigRootDir: __dirname,
      },
    },
    {
      extends: ['plugin:storybook/recommended'],
      files: ['**/*.stories.ts?(x)'],
      rules: {},
    },
  ],
  rules: {
    'import/prefer-default-export': 'off',
  },
};
