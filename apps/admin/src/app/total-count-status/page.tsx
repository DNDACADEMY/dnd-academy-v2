import { api, getLatestItemReduce, type TotalCountStatus } from '@dnd-academy/core';
import { CounterCard, PageTitle } from '@dnd-academy/ui';
import { list } from '@vercel/blob';

import TotalCountStatusForm from '@/components/TotalCountStatusForm';

import styles from './page.module.scss';

async function page() {
  const { blobs } = await list({
    prefix: 'total_count_status',
    token: process.env.DND_ACADEMY_V2_BLOB_READ_WRITE_TOKEN,
  });

  const blob = getLatestItemReduce(blobs);

  const totalCountStatus = await api<TotalCountStatus>({
    url: blob.url,
    method: 'GET',
  });

  const {
    cumulativeApplicants, dropouts, totalParticipants, totalProjects,
  } = totalCountStatus;

  return (
    <>
      <PageTitle
        title="지원자 수 카드 섹션"
        subTitle="캐시 적용으로 실제 적용까지는 최대 5분정도 소요됩니다."
      />
      <div className={styles.counterCardWrapper}>
        <CounterCard count={cumulativeApplicants} title="누적 지원자 수" />
        <CounterCard count={totalParticipants} title="총 참가자 수" />
        <CounterCard count={totalProjects} title="총 프로젝트 수" suffix="개" />
        <CounterCard count={dropouts} title="이탈자 수" color="primary" />
      </div>
      <TotalCountStatusForm initialTotalCountStatus={totalCountStatus} />
    </>
  );
}

export default page;
