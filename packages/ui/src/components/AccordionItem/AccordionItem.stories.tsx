import { ComponentProps, useState } from 'react';

import type { Meta } from '@storybook/react';

import AccordionItem from '.';

const meta = {
  title: 'UI/AccordionItem',
  component: AccordionItem,
  args: {
    children: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Eos quod explicabo, nam sapiente id nostrum ex, ab numquam, doloremque aspernatur quisquam illo! Officiis explicabo laborum incidunt corrupti provident esse eligendi.',
    title: 'title',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AccordionItem>;

export default meta;

export function Default({
  title, children, currentIndex, activeIndex,
}: ComponentProps<typeof AccordionItem>) {
  const [index, setActiveIndex] = useState<number>();

  return (
    <AccordionItem
      title={title}
      currentIndex={currentIndex || 0}
      activeIndex={activeIndex || index}
      onClick={setActiveIndex}
    >
      {children}
    </AccordionItem>
  );
}
