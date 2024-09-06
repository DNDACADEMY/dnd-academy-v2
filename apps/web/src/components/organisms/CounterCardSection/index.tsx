import { api, getLatestItemReduce, type TotalCountStatus } from '@dnd-academy/core';
import { CounterCard } from '@dnd-academy/ui';
import { list } from '@vercel/blob';

import SectionTitle from '@/components/atoms/SectionTitle';
import { CURRENT_FLAG } from '@/lib/constants';

import styles from './index.module.scss';

type Props = {
  title: string;
};

async function CounterCardSection({ title }: Props) {
  const { blobs: totalCountStatusBlobs } = await list({
    prefix: 'total_count_status',
    token: process.env.DND_ACADEMY_V2_BLOB_READ_WRITE_TOKEN,
  });

  const latestTotalCountStatusBlob = getLatestItemReduce(totalCountStatusBlobs);

  const {
    cumulativeApplicants, dropouts, totalParticipants, totalProjects,
  } = await api<TotalCountStatus>({
    url: latestTotalCountStatusBlob.url,
    method: 'GET',
  });

  return (
    <SectionTitle title={title}>
      <div className={styles.counterCardWrapper}>
        <CounterCard count={cumulativeApplicants} title="누적 지원자 수" />
        <CounterCard count={totalParticipants} title="총 참가자 수" />
        <CounterCard count={totalProjects} title="총 프로젝트 수" suffix="개" />
        <CounterCard count={dropouts} title={`${CURRENT_FLAG}기 이탈자`} color="primary" />
      </div>
    </SectionTitle>
  );
}

export default CounterCardSection;
