import { ReactElement, useRef } from 'react';

import { Button } from '@dnd-academy/ui';
import clsx from 'clsx';
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

  useOnClickOutside(modalContentsRef, () => toggle(false));
  useScrollLock({ autoLock: open });

  return (
    <GlobalPortal>
      {open && (
        <div className={clsx(styles.modalWrapper, open && styles.open)}>
          <div
            ref={modalContentsRef}
            role="dialog"
            className={clsx(styles.modalBox, styles[size])}
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
          </div>
        </div>
      )}
    </GlobalPortal>
  );
}
export default ModalContentsBase;
