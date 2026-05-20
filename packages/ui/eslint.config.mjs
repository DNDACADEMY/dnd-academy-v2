import baseConfig from '@dnd-academy/eslint-config';
import storybook from 'eslint-plugin-storybook';

export default [
  ...baseConfig,
  ...storybook.configs['flat/recommended'],
  {
    rules: {
      'storybook/no-renderer-packages': 'off',
    },
  },
];
