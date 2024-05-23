'use client';

import { memo } from 'react';

import Button, { ButtonSize } from '@/components/atoms/Button';
import Modal from '@/components/molecules/Modal';

import styles from './index.module.scss';

type Props = {
  buttonText: string;
  buttonSize?: ButtonSize;
};

function AlarmModal({ buttonText, buttonSize }: Props) {
  return (
    <Modal>
      <Modal.OpenButton>
        <Button type="button" size={buttonSize}>{buttonText}</Button>
      </Modal.OpenButton>
      <Modal.ContentsBase title="알림 신청">
        <div className={styles.contentsWrapper}>
          <div className={styles.description}>
            <strong>DND 참가자 모집</strong>
            {'이 마감되었습니다.😞\n참가자 모집이 시작될 때 문자로 알려드릴게요.'}
          </div>
          <Button type="button" size="large">확인</Button>
        </div>
      </Modal.ContentsBase>
    </Modal>
  );
}

export default memo(AlarmModal);
