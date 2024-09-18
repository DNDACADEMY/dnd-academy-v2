import { type TotalCountStatus } from '@dnd-academy/core';
import { CounterCard } from '@dnd-academy/ui';
import { withServerErrorBoundary } from '@dnd-academy/ui/server';

import SectionTitle from '@/components/atoms/SectionTitle';
import { CURRENT_FLAG } from '@/lib/constants';

import styles from './index.module.scss';

type Props = {
  title: string;
  data: TotalCountStatus;
};

async function CounterCardSection({ title, data }: Props) {
  const {
    cumulativeApplicants,
    totalParticipants,
    totalProjects,
    dropouts,
  } = data;

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

export default withServerErrorBoundary(CounterCardSection, {
  url: '/blob/latest/total_count_status',
  type: 'bff',
});
