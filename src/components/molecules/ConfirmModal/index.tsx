import Button from '@/components/atoms/Button';

import styles from './index.module.scss';

type Props = {
  title: string;
  description?: string;
};

function ConfirmModal({
  title, description,
}: Props) {
  return (
    <div>
      <div>{title}</div>
      {description && (
        <div>{description}</div>
      )}
      <div className={styles.buttonWrapper}>
        <Button type="button">확인</Button>
      </div>
    </div>
  );
}

export default ConfirmModal;
