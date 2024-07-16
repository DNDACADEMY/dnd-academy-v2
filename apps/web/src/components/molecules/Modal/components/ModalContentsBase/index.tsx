import { ReactElement, useContext, useRef } from 'react';

import { Button } from '@dnd-academy/ui/client';
import clsx from 'clsx';
import { useOnClickOutside } from 'usehooks-ts';

import GlobalPortal from '@/components/global/GlobalPortal';
import { CloseIcon } from '@/lib/assets/icons';

import { ModalContext } from '../ModalProvider';

import styles from './index.module.scss';

type Props = {
  title: string;
  size?: 'small' | 'medium' | 'large';
  children: ReactElement;
};

function ModalContentsBase({ children: child, title, size = 'medium' } : Props) {
  const modalContentsRef = useRef<HTMLDivElement>(null);
  const modalContext = useContext(ModalContext);

  if (!modalContext) {
    throw new Error('ModalContents must be used inside a Modal');
  }

  const [isOpen, setIsOpen] = modalContext;

  useOnClickOutside(modalContentsRef, () => setIsOpen(false));

  return (
    <GlobalPortal>
      {isOpen && (
        <div className={clsx(styles.modalWrapper, isOpen && styles.open)}>
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
                onClick={() => setIsOpen(false)}
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
