import type { Meta, StoryObj } from '@storybook/react';

import AccordionItem from '.';

const meta = {
  title: 'Components/AccordionItem',
  component: AccordionItem,
  parameters: {
    layout: 'centered',
  },
  args: {
    children: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Eos quod explicabo, nam sapiente id nostrum ex, ab numquam, doloremque aspernatur quisquam illo! Officiis explicabo laborum incidunt corrupti provident esse eligendi.',
    title: 'title',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AccordionItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isActive: false,
  },
};
