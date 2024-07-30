import type { Meta, StoryObj } from '@storybook/react';

import PageTitle from '.';

const meta = {
  title: 'atoms/PageTitle',
  component: PageTitle,
  parameters: {
    layout: 'centered',
  },
  args: {
    title: 'title',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PageTitle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const HasSubtitle: Story = {
  args: {
    subTitle: 'subTitle',
  },
};
