import type { Meta, StoryObj } from '@storybook/react';

import Tag from '.';

const meta = {
  title: 'atoms/Tag',
  component: Tag,
  parameters: {
    layout: 'centered',
  },
  args: {
    count: 10,
    size: 'medium',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Tag>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: '전체',
  },
};

export const Active: Story = {
  args: {
    title: '전체',
    isActive: true,
  },
};

export const SmallSize: Story = {
  args: {
    title: '전체',
    size: 'small',
  },
};
