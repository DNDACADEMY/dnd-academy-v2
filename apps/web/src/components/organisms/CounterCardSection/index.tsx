import { ReactNode } from 'react';

import { CounterCard } from '@dnd-academy/ui';

import SectionTitle from '@/components/atoms/SectionTitle';
import { totalCountStatusData } from '@/lib/assets/data';
import { CURRENT_FLAG } from '@/lib/constants';
import { isChristmasTheme } from '@/utils';

import styles from './index.module.scss';

type CardConfig = {
  count: number;
  title: string;
  color: 'green' | 'red' | 'gray';
  suffix?: string;
  highlight?: boolean;
};

type Props = {
  title: ReactNode;
};

async function CounterCardSection({ title: sectionTitle }: Props) {
  const {
    cumulativeApplicants, dropouts, totalParticipants, totalProjects,
  } = totalCountStatusData;

  const cardConfigs: CardConfig[] = [
    { count: cumulativeApplicants, title: '누적 지원자 수', color: 'red' },
    { count: totalParticipants, title: '총 참가자 수', color: 'green' },
    {
      count: totalProjects, title: '총 프로젝트 수', color: 'red', suffix: '개',
    },
    {
      count: dropouts, title: `${CURRENT_FLAG - 1}기 이탈자`, color: 'green', highlight: true,
    },
  ];

  return (
    <SectionTitle title={sectionTitle}>
      <div className={styles.counterCardWrapper}>
        {cardConfigs.map(({
          count, title, color, suffix, highlight,
        }) => (
          <CounterCard
            key={title}
            count={count}
            title={title}
            color={isChristmasTheme() ? color : 'gray'}
            suffix={suffix}
            highlight={highlight}
          />
        ))}
      </div>
    </SectionTitle>
  );
}

export default CounterCardSection;
