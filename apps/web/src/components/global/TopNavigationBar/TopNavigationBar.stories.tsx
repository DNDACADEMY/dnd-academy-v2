import type { Meta, StoryObj } from '@storybook/react';

import TopNavigationBar from '.';

const meta = {
  title: 'Components/TopNavigationBar',
  component: TopNavigationBar,
  args: {},
  decorators: (story) => <div style={{ minHeight: '200px' }}>{story()}</div>,
  tags: ['autodocs'],
} satisfies Meta<typeof TopNavigationBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
