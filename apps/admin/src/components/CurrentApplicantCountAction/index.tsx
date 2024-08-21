'use client';

import { api, type CurrentApplicantCount } from '@dnd-academy/core';
import { Button } from '@dnd-academy/ui';
import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';

import styles from './index.module.scss';

function CurrentApplicantCountAction() {
  const { mutate, isSuccess } = useMutation({
    mutationFn: async () => {
      await api<CurrentApplicantCount>({
        url: '/current-applicant-count',
        method: 'PUT',
        type: 'bff',
      });
    },
  });

  return (
    <div className={styles.applicantCountWrapper}>
      <Button onClick={() => mutate()}>최신 지원자수 반영하기</Button>
      {isSuccess && (
        <div className={clsx(styles.message, styles.success)}>지원자수가 최신으로 업데이트 되었습니다.</div>
      )}
    </div>
  );
}

export default CurrentApplicantCountAction;
