import { ReactElement, useContext } from 'react';

import clsx from 'clsx';

import Button from '@/components/atoms/Button';
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
  const modalContext = useContext(ModalContext);

  if (!modalContext) {
    throw new Error('ModalContents must be used inside a Modal');
  }

  const [isOpen, setIsOpen] = modalContext;

  return (
    <GlobalPortal>
      {isOpen && (
        <div className={clsx(styles.modalWrapper, isOpen && styles.open)}>
          <div role="dialog" className={clsx(styles.modalBox, styles[size])}>
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
