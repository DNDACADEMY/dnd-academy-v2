import { ReactElement, RefObject, useRef } from 'react';

import { Button } from '@dnd-academy/ui';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'motion/react';
import { useOnClickOutside, useScrollLock } from 'usehooks-ts';

import GlobalPortal from '@/components/global/GlobalPortal';
import { useModalContext } from '@/components/molecules/Modal/components/ModalProvider';
import { CloseIcon } from '@/lib/assets/icons';

import styles from './index.module.scss';

type Props = {
  title: string;
  size?: 'small' | 'medium' | 'large';
  children: ReactElement;
};

function ModalContentsBase({ children: child, title, size = 'medium' } : Props) {
  const modalContentsRef = useRef<HTMLDivElement>(null);
  const { open, toggle } = useModalContext();

  // FIX - https://github.com/juliencrn/usehooks-ts/issues/602
  useOnClickOutside(modalContentsRef as RefObject<HTMLDivElement>, () => toggle(false));
  useScrollLock({ autoLock: open });

  return (
    <GlobalPortal>
      <AnimatePresence>
        {open && (
          <motion.div
            className={clsx(styles.modalWrapper)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              ref={modalContentsRef}
              role="dialog"
              className={clsx(styles.modalBox, styles[size])}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
                duration: 0.3,
              }}
            >
              <div className={styles.header}>
                <h1 className={styles.title}>{title}</h1>
                <Button
                  type="button"
                  className={styles.closeButton}
                  onClick={() => toggle(false)}
                  icon={<CloseIcon />}
                />
              </div>
              {child}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlobalPortal>
  );
}
export default ModalContentsBase;
