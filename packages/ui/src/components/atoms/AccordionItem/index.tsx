'use client';

import { memo, PropsWithChildren } from 'react';

import clsx from 'clsx';
import { AnimatePresence, motion } from 'motion/react';

import { AccordionPolygon } from '../../../lib/assets/icons';

import styles from './index.module.scss';

type Props = {
  title: string;
  onClick: (index?: number) => void;
  activeIndex?: number;
  currentIndex: number;
};

function AccordionItem({
  title, onClick, activeIndex, currentIndex, children,
}: PropsWithChildren<Props>) {
  const isActive = activeIndex === currentIndex;

  const handleClick = () => {
    if (activeIndex === currentIndex) {
      onClick(undefined);
      return;
    }

    onClick(currentIndex);
  };

  return (
    <div className={styles.accordionItem}>
      <motion.button
        type="button"
        className={clsx(styles.accordionHeader, isActive && styles.active)}
        onClick={handleClick}
      >
        <div>
          {title}
        </div>
        <AccordionPolygon className={clsx(
          styles.polygonIcon,
          isActive && styles.active,
        )}
        />
      </motion.button>
      <AnimatePresence initial={false}>
        {isActive && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0 }}
          >
            <div className={styles.accordionPanel}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default memo(AccordionItem);
