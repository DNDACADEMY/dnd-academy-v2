'use client';

import { useActionState } from 'react';

import { type TotalCountStatus } from '@dnd-academy/core';
import clsx from 'clsx';

import { totalCountStatusAction } from '@/actions/count';
import SubmitButton from '@/components/common/SubmitButton';

import styles from './index.module.scss';

type Props = {
  initialTotalCountStatus: TotalCountStatus;
};

function TotalCountStatusForm({ initialTotalCountStatus }: Props) {
  const [state, formAction] = useActionState(totalCountStatusAction, null);

  const {
    cumulativeApplicants, dropouts, totalParticipants, totalProjects,
  } = initialTotalCountStatus;

  return (
    <div className={styles.totalCountStatusFormWrapper}>
      <form
        action={formAction}
        className={styles.totalCountStatusForm}
      >
        <input type="number" name="cumulativeApplicants" min={0} placeholder="누적 지원자 수" defaultValue={cumulativeApplicants} required />
        <input type="number" name="totalParticipants" min={0} placeholder="총 참가자 수" defaultValue={totalParticipants} required />
        <input type="number" name="totalProjects" min={0} placeholder="총 프로젝트 수" defaultValue={totalProjects} required />
        <input type="number" name="dropouts" min={0} placeholder="이탈자 수" defaultValue={dropouts} required />
        <SubmitButton>업데이트하기</SubmitButton>
      </form>
      {state?.message && (
        <div className={clsx(
          styles.message,
          state.messageType && styles[state.messageType],
        )}
        >
          {state.message}
        </div>
      )}
    </div>
  );
}

export default TotalCountStatusForm;
