module.exports = {
  ignorePatterns: [
    'public/',
    '/.next',
  ],
  extends: [
    '../../.eslintrc.js',
    'plugin:@next/next/recommended',
  ],
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
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
  ],
  rules: {},
};
