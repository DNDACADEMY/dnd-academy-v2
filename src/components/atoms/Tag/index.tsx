'use client';

import { memo, MouseEvent } from 'react';

import clsx from 'clsx';
import { motion } from 'framer-motion';

import styles from './index.module.scss';

type Props = {
  title: string;
  count: number;
  size: 'small' | 'medium';
  isActive?: boolean;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
};

function Tag({
  title, onClick, isActive, count, size,
}: Props) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={clsx(styles.tag, isActive && styles.active, styles[size])}
    >
      <span className={clsx(isActive && styles.active)}>{title}</span>
      &nbsp;
      {`(${count})`}
    </motion.button>
  );
}

export default memo(Tag);
