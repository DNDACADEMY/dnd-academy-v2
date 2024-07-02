import React from 'react';

import type { Preview } from "@storybook/react";

import 'src/styles/global.scss';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
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
