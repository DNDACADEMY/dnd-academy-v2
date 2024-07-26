'use client';

import { useState } from 'react';

import { AccordionItem } from '@dnd-academy/ui';

import { faqData } from '@/lib/assets/data';

import styles from './index.module.scss';

type Props = {
  faq: typeof faqData;
};

function FAQSection({ faq }: Props) {
  const [activeIndex, setActiveIndex] = useState<number>();

  return (
    <div className={styles.faqWrapper}>
      {faq.map(({ answer, question }, index) => (
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
