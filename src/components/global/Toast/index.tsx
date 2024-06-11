'use client';

import {
  useCallback, useEffect, useMemo, useRef, useState,
} from 'react';

import clsx from 'clsx';
import { AnimationDefinition, motion } from 'framer-motion';

import {
  ErrorCircleIcon, InfoCircleIcon, SuccessCircleIcon, WarningIcon,
} from '@/lib/assets/icons';
import useToastStore from '@/stores/toast';
import { upToBottomVariants } from '@/styles/framerVariants';

import styles from './index.module.scss';

function Toast() {
  const {
    isRender, message, closeToast, delay, type,
  } = useToastStore(['closeToast', 'isRender', 'message', 'delay', 'type']);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isOpenToast, setIsOpenToast] = useState<boolean>(false);

  const handleAnimationComplete = useCallback((definition: AnimationDefinition) => {
    if (definition === 'hidden') {
      closeToast();
    }
  }, []);

  const iconClassName = clsx(styles.toastIcon, styles[type]);

  const icon = useMemo(() => ({
    warn: <WarningIcon className={iconClassName} />,
    success: <SuccessCircleIcon className={iconClassName} />,
    info: <InfoCircleIcon className={iconClassName} />,
    error: <ErrorCircleIcon className={iconClassName} />,
  }[type]), [iconClassName, type]);

  useEffect(() => {
    if (isOpenToast) {
      timer.current = setTimeout(() => {
        setIsOpenToast(false);
        timer.current = null;
      }, delay);
    }

    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, [isOpenToast, delay]);

  useEffect(() => {
    if (isRender) {
      setIsOpenToast(true);
    }
  }, [isRender]);

  if (!isRender) {
    return null;
  }

  return (
    <motion.div
      animate={isOpenToast ? 'visible' : 'hidden'}
      initial="hidden"
      variants={upToBottomVariants}
      className={styles.toastContainer}
      onAnimationComplete={handleAnimationComplete}
    >
      <div className={clsx(styles.toastBox, {
        [styles[type]]: type,
      })}
      >
        {icon}
        <div className={styles.toastMessage}>
          {message}
        </div>
      </div>
    </motion.div>
  );
}

export default Toast;
