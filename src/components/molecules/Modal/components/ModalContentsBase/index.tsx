import { ReactElement, useContext } from 'react';

import clsx from 'clsx';

import Button from '@/components/atoms/Button';
import GlobalPortal from '@/components/global/GlobalPortal';

import { ModalContext } from '../ModalProvider';

import styles from './index.module.scss';

function ModalContentsBase({ children: child } : { children: ReactElement }) {
  const modalContext = useContext(ModalContext);

  if (!modalContext) {
    throw new Error('ModalContents must be used inside a Modal');
  }

  const [isOpen, setIsOpen] = modalContext;

  return (
    <GlobalPortal>
      <div className={clsx(styles.modalWrapper, isOpen && styles.open)}>
        <div className={styles.modalBox}>
          <div className={styles.header}>
            <Button type="button" onClick={() => setIsOpen(false)} buttonType="secondary">취소</Button>
          </div>
          {child}
        </div>
      </div>
    </GlobalPortal>
  );
}
export default ModalContentsBase;
