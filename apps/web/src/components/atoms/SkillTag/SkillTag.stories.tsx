import type { Meta, StoryObj } from '@storybook/react';

import SkillTag from '.';

const meta = {
  title: 'Components/SkillTag',
  component: SkillTag,
  parameters: {
    layout: 'centered',
  },
  args: {
    skill: 'skill',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SkillTag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DarkColor: Story = {
  args: {
    color: 'dark',
  },
};

export const GreyColor: Story = {
  args: {
    color: 'grey',
  },
};
