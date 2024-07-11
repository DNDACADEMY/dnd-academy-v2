import React from 'react';

import type { Preview } from "@storybook/react";

import '@dnd-academy/ui/style.css';
import 'src/styles/global.scss';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on.*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    tags: ["autodocs"],
    backgrounds: {
      default: 'dnd',
      values: [
        {
          name: 'dnd',
          value: '#13161C',
        },
      ]
    },
  },
};

export default preview;
