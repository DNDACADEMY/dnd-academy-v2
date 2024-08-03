'use client';

import { useFormState } from 'react-dom';

import { type CurrentApplicantCount } from '@dnd-academy/core';
import clsx from 'clsx';

import { currentApplicantCountAction } from '@/actions/count';
import SubmitButton from '@/components/common/SubmitButton';

import styles from './index.module.scss';

type Props = {
  initialApplicantCount: CurrentApplicantCount;
};

function CurrentApplicantCountForm({ initialApplicantCount }: Props) {
  const [state, formAction] = useFormState(currentApplicantCountAction, null);

  return (
    <div className={styles.applicantCountFormWrapper}>
      <form action={formAction} className={styles.applicantCountForm}>
        <div>
          <label htmlFor="designer">
            디자이너 지원자 수
            <input type="number" id="designer" name="designerApplicantCount" defaultValue={initialApplicantCount.designer} />
          </label>
        </div>
        <div>
          <label htmlFor="developer">
            개발자 지원자 수
            <input type="number" id="developer" name="developerApplicantCount" defaultValue={initialApplicantCount.developer} />
          </label>
        </div>
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

export default CurrentApplicantCountForm;
