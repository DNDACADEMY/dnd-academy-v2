'use client';

import { useState } from 'react';

import { FAQ } from '@dnd-academy/core';
import { AccordionItem } from '@dnd-academy/ui';

import styles from './index.module.scss';

type Props = {
  faqItems: FAQ[];
};

function FAQSection({ faqItems }: Props) {
  const [activeIndex, setActiveIndex] = useState<number>();

  return (
    <div className={styles.faqWrapper}>
      {faqItems.map(({ answer, question }, index) => (
        <AccordionItem
          key={question}
          title={`Q : ${question}`}
          onClick={setActiveIndex}
          currentIndex={index}
          activeIndex={activeIndex}
        >
          {`A : ${answer}`}
        </AccordionItem>
      ))}
    </div>
  );
}

export default FAQSection;
