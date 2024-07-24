module.exports = {
  extends: [
    '@dnd-academy/eslint-config',
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
    'import/no-extraneous-dependencies': 'off',
    'import/prefer-default-export': 'off',
  },
};
