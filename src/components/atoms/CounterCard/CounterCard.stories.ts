import type { Meta, StoryObj } from '@storybook/react';

import CounterCard from '.';

const meta = {
  title: 'Components/CounterCard',
  component: CounterCard,
  parameters: {
    layout: 'centered',
  },
  args: {},
  tags: ['autodocs'],
} satisfies Meta<typeof CounterCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    count: 1000,
    title: '지원자 수',
  },
};
