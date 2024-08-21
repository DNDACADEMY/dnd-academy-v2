import { api, type CurrentApplicantCount } from '@dnd-academy/core';
import { Counter, PageTitle } from '@dnd-academy/ui';

import CurrentApplicantCountAction from '@/components/CurrentApplicantCountAction';

import styles from './page.module.scss';

async function page() {
  const currentApplicantCountData = await api<CurrentApplicantCount>({
    url: '/current_applicant_count.json',
    method: 'GET',
  });

  const currentApplicantCount = currentApplicantCountData.designer
    + currentApplicantCountData.developer;

  return (
    <>
      <PageTitle
        title="현재 지원자 수"
        subTitle="캐시 적용으로 실제 적용까지는 최대 5분정도 소요됩니다."
      />
      <div className={styles.counter}>
        오늘까지&nbsp;
        <Counter count={currentApplicantCount} />
        명이 지원했어요!
      </div>
      <CurrentApplicantCountAction />
    </>
  );
}

export default page;
