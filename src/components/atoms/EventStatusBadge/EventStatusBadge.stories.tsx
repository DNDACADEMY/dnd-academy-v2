import type { Meta, StoryObj } from '@storybook/react';

import EventStatusBadge from '.';

const meta = {
  title: 'Components/EventStatusBadge',
  component: EventStatusBadge,
  parameters: {
    layout: 'centered',
  },
  args: {},
  tags: ['autodocs'],
} satisfies Meta<typeof EventStatusBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Info: Story = {
  args: {
    type: 'info',
    text: 'DND는 6기 진행중',
  },
};

export const Success: Story = {
  args: {
    type: 'success',
    text: 'DND는 6기 진행중',
  },
};

export const Warn: Story = {
  args: {
    type: 'warn',
    text: 'DND는 6기 진행중',
  },
};

export const Error: Story = {
  args: {
    type: 'error',
    text: 'DND는 6기 진행중',
  },
};
