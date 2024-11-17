import { Variants } from 'motion/react';

// eslint-disable-next-line import/prefer-default-export
export const upToBottomVariants: Variants = {
  hidden: {
    y: '-100%',
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};
