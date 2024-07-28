import type { Meta, StoryObj } from '@storybook/react';

import Button from '.';

const meta = {
  title: 'molecules/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  args: {
    children: 'button',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    buttonType: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    buttonType: 'secondary',
  },
};

export const Clear: Story = {
  args: {
    buttonType: 'clear',
  },
};

export const XLarge: Story = {
  args: {
    size: 'xLarge',
  },
};

export const Large: Story = {
  args: {
    size: 'large',
  },
};

export const Medium: Story = {
  args: {
    size: 'medium',
  },
};

export const Small: Story = {
  args: {
    size: 'small',
  },
};
