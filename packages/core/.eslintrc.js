module.exports = {
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'coverage/',
  ],
  extends: [
    '../../.eslintrc.js',
  ],
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: [
          './tsconfig.json',
        ],
        tsconfigRootDir: __dirname,
      },
    },
  ],
  rules: {
    'import/export': 'off',
    'import/prefer-default-export': 'off',
    'import/no-extraneous-dependencies': 'off',
  },
};
