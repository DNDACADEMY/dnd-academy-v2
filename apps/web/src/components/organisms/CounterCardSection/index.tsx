import { ReactNode } from 'react';

import { CounterCard } from '@dnd-academy/ui';

import SectionTitle from '@/components/atoms/SectionTitle';
import { totalCountStatusData } from '@/lib/assets/data';
import { CURRENT_FLAG } from '@/lib/constants';

import styles from './index.module.scss';

type Props = {
  title: ReactNode;
};

async function CounterCardSection({ title }: Props) {
  const {
    cumulativeApplicants, dropouts, totalParticipants, totalProjects,
  } = totalCountStatusData;

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
