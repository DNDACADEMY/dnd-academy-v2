module.exports = {
  root: true,
  env: {
    es6: true,
    browser: true,
    jest: true,
  },
  extends: [
    'airbnb',
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:react/jsx-runtime',
  ],
  plugins: [
    'simple-import-sort',
    'unused-imports',
  ],
  ignorePatterns: [
    'node_modules/',
    '.pnp.cjs',
    '.pnp.loader.cjs',
    'public/',
    '.yarn/',
    'dist/',
    'coverage/',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      extends: [
        'airbnb-typescript',
        'plugin:@typescript-eslint/recommended',
      ],
      plugins: [
        '@typescript-eslint',
      ],
      rules: {
        '@typescript-eslint/no-use-before-define': 'off',
        '@typescript-eslint/naming-convention': 'off',
        '@typescript-eslint/no-explicit-any': 'warn',
      },
    },
    {
      files: ['src/hooks/**/**/*.test.ts?(x)'],
      rules: {
        'react-hooks/rules-of-hooks': 'off',
      },
    },
    {
      files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
      extends: ['plugin:testing-library/react', 'plugin:jest/recommended'],
      rules: {
        'react-hooks/rules-of-hooks': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
  rules: {
    'react/require-default-props': 'off',
    'import/order': 'off',
    'simple-import-sort/imports': ['error', {
      groups: [
        ['^\\u0000'],
        ['^(assert|buffer|child_process|cluster|console|constants|crypto|dgram|dns|domain|events|fs|http|https|module|net|os|path|punycode|querystring|readline|repl|stream|string_decoder|sys|timers|tls|tty|url|util|vm|zlib|freelist|v8|process|async_hooks|http2|perf_hooks)(/.*|$)'],
        ['^react'],
        ['^next'],
        ['^@?\\w'],
        ['^(@|lib|components|utils|hooks)(/.*|$)'],
        ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
        ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
        ['^.+\\.svg$'],
        ['^.+\\.s?css$'],
      ],
    }],
    'simple-import-sort/exports': 'error',
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': ['warn', {
      vars: 'all',
      varsIgnorePattern: '^_',
      args: 'after-used',
      argsIgnorePattern: '^_',
    }],
  },
};
