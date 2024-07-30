import type { Meta, StoryObj } from '@storybook/react';

import SectionTitle from '.';

const meta = {
  title: 'atoms/SectionTitle',
  component: SectionTitle,
  parameters: {
    layout: 'centered',
  },
  args: {},
  argTypes: {
    children: {
      description: '`ReactNode`',
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SectionTitle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'DND의 프로젝트가 궁금하나요?',
    children: <div>title children</div>,
  },
};
