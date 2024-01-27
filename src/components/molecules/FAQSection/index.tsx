'use client';

import { useState } from 'react';

import AccordionItem from '@/components/atoms/AccordionItem';
import faq from '@/lib/data/faq';

import styles from './index.module.scss';

function FAQSection() {
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
