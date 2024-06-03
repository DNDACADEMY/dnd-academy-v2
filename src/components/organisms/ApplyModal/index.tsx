'use client';

import Button, { ButtonSize } from '@/components/atoms/Button';
import Modal from '@/components/molecules/Modal';
import { CURRENT_FLAG, DESIGNER_APPLICATION_LINK, DEVELOPER_APPLICATION_LINK } from '@/lib/constants';

import styles from './index.module.scss';

type Props = {
  buttonSize?: ButtonSize;
};

function ApplyModal({ buttonSize }: Props) {
  return (
    <Modal>
      <Modal.OpenButton>
        <Button type="button" size={buttonSize}>{`${CURRENT_FLAG}기 지원하기`}</Button>
      </Modal.OpenButton>
      <Modal.ContentsBase title={`${CURRENT_FLAG}기 지원하기`} size="small">
        <div className={styles.contentsWrapper}>
          <div className={styles.description}>
            <strong>DND</strong>
            {'는 개발자, 디자이너들의\n지원을 기다리고 있습니다💖\n\n어떤 유형으로 지원하시나요?'}
          </div>
          <div className={styles.buttonWrapper}>
            <Button
              isExternalLink
              href={DESIGNER_APPLICATION_LINK}
              size="large"
              buttonType="purple"
              fullWidth
            >
              디자이너
            </Button>
            <Button
              isExternalLink
              href={DEVELOPER_APPLICATION_LINK}
              size="large"
              buttonType="primary"
              fullWidth
            >
              개발자
            </Button>
          </div>
        </div>
      </Modal.ContentsBase>
    </Modal>
  );
}

export default ApplyModal;
