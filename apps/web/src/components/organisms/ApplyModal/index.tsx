'use client';

import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';

import { Button, ButtonProps } from '@dnd-academy/ui';

import Modal from '@/components/molecules/Modal';
import { CURRENT_FLAG, DESIGNER_APPLICATION_LINK, DEVELOPER_APPLICATION_LINK } from '@/lib/constants';

import styles from './index.module.scss';

type Props = {
  children?: ReactElement<ButtonProps>;
};

function ApplyModal({ children: child }: Props) {
  if (!isValidElement<ButtonProps>(child)) {
    return null;
  }

  const label = <span key="default-label">{`${CURRENT_FLAG}기 지원하기`}</span>;
  const children: ReactNode = child.props.children ? (
    <>
      {label}
      {child.props.children}
    </>
  ) : (
    label
  );

  return (
    <Modal>
      <Modal.OpenButton>
        {/* NOTE - cloneElement로 지원 모달 오픈 동작과 기본 라벨을 주입하는 계약입니다. 변경 시 버튼 클릭 플로우를 함께 확인해야 합니다. */}
        {cloneElement(child, child.props, children)}
      </Modal.OpenButton>
      <Modal.ContentsBase title={`${CURRENT_FLAG}기 지원하기`} size="small">
        <div className={styles.contentsWrapper}>
          <div className={styles.description}>
            <strong>DND</strong>
            {'는 개발자, 디자이너들의\n지원을 기다리고 있습니다💖\n\n어떤 유형으로 지원하시나요?'}
          </div>
          <div className={styles.buttonWrapper}>
            <Button isExternalLink href={DESIGNER_APPLICATION_LINK} size="large" buttonType="purple" fullWidth>
              디자이너
            </Button>
            <Button isExternalLink href={DEVELOPER_APPLICATION_LINK} size="large" buttonType="primary" fullWidth>
              개발자
            </Button>
          </div>
        </div>
      </Modal.ContentsBase>
    </Modal>
  );
}

export default ApplyModal;
