module.exports = {
  ignorePatterns: [
    'node_modules/',
    'public/',
    'dist/',
    'coverage/',
  ],
  extends: [
    '../../.eslintrc.js',
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
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
    },
    {
      files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
      rules: {
        'react-hooks/rules-of-hooks': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
  rules: {
    'import/export': 'off',
    'import/prefer-default-export': 'off',
    'import/no-extraneous-dependencies': 'off',
    'react/require-default-props': 'off',
  },
};
