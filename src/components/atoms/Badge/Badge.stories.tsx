import type { Meta, StoryObj } from '@storybook/react';

import Badge from '.';

const meta = {
  title: 'Components/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  args: {},
  tags: ['autodocs'],
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Info: Story = {
  args: {
    variant: 'info',
    label: 'DND는 6기 진행중',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    label: 'DND는 6기 진행중',
  },
};

export const Notice: Story = {
  args: {
    variant: 'notice',
    label: 'DND는 6기 진행중',
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    label: 'DND는 6기 진행중',
  },
};

export const Large: Story = {
  args: {
    variant: 'info',
    label: 'DND는 6기 진행중',
    size: 'large',
  },
};

export const LightTheme: Story = {
  args: {
    variant: 'info',
    label: 'DND는 6기 진행중',
    theme: 'light',
  },
};
