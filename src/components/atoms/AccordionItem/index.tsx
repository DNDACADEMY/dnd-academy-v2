'use client';

import { memo, PropsWithChildren } from 'react';

import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';

import { AccordionPolygon } from '@/lib/assets/icons';

import styles from './index.module.scss';

type Props = {
  title: string;
  onClick: () => void;
  isActive: boolean;
};

function AccordionItem({
  title, onClick, isActive, children,
}: PropsWithChildren<Props>) {
  return (
    <div className={styles.accordionItem}>
      <motion.button
        type="button"
        className={clsx(styles.accordionHeader, isActive && styles.active)}
        onClick={onClick}
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
