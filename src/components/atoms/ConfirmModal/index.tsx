import clsx from 'clsx';

import GlobalPortal from '@/components/global/GlobalPortal';

import Button from '../Button';

import styles from './index.module.scss';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  title: string;
  description?: string;
};

function ConfirmModal({
  isOpen, onClose, title, description, onSubmit,
}: Props) {
  return (
    <GlobalPortal>
      <div className={clsx(styles.confirmModalWrapper, isOpen && styles.open)}>
        <div className={styles.confirmModalBox}>
          <div>{title}</div>
          {description && (
            <div>{description}</div>
          )}
          <div className={styles.buttonWrapper}>
            <Button type="button" onClick={onClose} buttonType="secondary">취소</Button>
            <Button type="button" onClick={onSubmit}>확인</Button>
          </div>
        </div>
      </div>
    </GlobalPortal>
  );
}

export default ConfirmModal;
