'use client';

import { useCallback, useState } from 'react';

import AccordionItem from '@/components/atoms/AccordionItem';
import faq from '@/lib/data/faq';

import styles from './index.module.scss';

function FAQSection() {
  const [activeIndex, setActiveIndex] = useState<number>();

  const handleClick = useCallback((index: number) => {
    if (activeIndex === index) {
      setActiveIndex(undefined);
      return;
    }

    setActiveIndex(index);
  }, [activeIndex]);

  return (
    <div className={styles.faqWrapper}>
      {faq.map(({ answer, question }, index) => (
        <AccordionItem
          key={question}
          title={`Q : ${question}`}
          onClick={() => handleClick(index)}
          isActive={activeIndex === index}
        >
          {`A : ${answer}`}
        </AccordionItem>
      ))}
    </div>
  );
}

export default FAQSection;
