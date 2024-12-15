import { headers } from 'next/headers';

import { api, CurrentApplicantCount } from '@dnd-academy/core';
import { Counter, PageTitle } from '@dnd-academy/ui';

import CurrentApplicantCountAction from '@/components/CurrentApplicantCountAction';

import styles from './page.module.scss';

async function Page() {
  const headersList = await headers();
  const host = headersList.get('host');

  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';

  const currentApplicantCountData = await api<CurrentApplicantCount>({
    url: `${protocol}://${host}/api/blob/latest/current_applicant_count`,
  });

  const { designer, developer } = currentApplicantCountData;

  return (
    <>
      <PageTitle
        title="현재 지원자 수"
        subTitle="현재 지원자 수는 google form의 spreadsheet를 통해 실시간으로 업데이트 됩니다."
      />
      <div className={styles.counter}>
        오늘까지&nbsp;
        <Counter count={designer + developer} />
        명이 지원했어요!
      </div>
      <CurrentApplicantCountAction />
      <strong>
        기본적으로 매일 00:00에 자동으로 반영되지만, 클릭시에는 즉시 반영할 수 있습니다.
      </strong>
    </>
  );
}

export default Page;
