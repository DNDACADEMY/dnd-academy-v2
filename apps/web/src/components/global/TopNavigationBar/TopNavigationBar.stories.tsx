import type { Decorator, Meta, StoryObj } from '@storybook/react';

import TopNavigationBar from '.';

const withNavigationFrame: Decorator = (Story) => <div style={{ minHeight: '200px' }}><Story /></div>;

const meta = {
  title: 'global/TopNavigationBar',
  component: TopNavigationBar,
  args: {},
  decorators: [withNavigationFrame],
  tags: ['autodocs'],
} satisfies Meta<typeof TopNavigationBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
