import type { HomeInput } from '@/lib/cms/home-contract';

import styles from '../styles.module.scss';

const statsLabels = {
  cumulativeApplicants: '누적 지원자 수',
  totalParticipants: '총 참가자 수',
  totalProjects: '총 프로젝트 수',
  dropoutCohort: '이탈자 집계 기수',
  dropouts: '이탈자 수',
} as const;

export function Statistics({
  rows,
  onChange,
}: {
  rows: HomeInput['stats'];
  onChange: (stats: HomeInput['stats']) => void;
}) {
  return (
    <div className={styles.homeFields}>
      <p className={styles.muted}>총 프로젝트 수는 누적 실적으로 집계합니다. 공개 프로젝트 목록과 별도로 관리하세요.</p>
      <div className={styles.grid}>
        {(Object.entries(statsLabels) as [keyof typeof statsLabels, string][]).map(([key, label]) => (
          <label key={key}>
            {label}
            <input
              type="number"
              min={key === 'dropoutCohort' ? 1 : 0}
              value={rows[key]}
              onChange={(event) => onChange({ ...rows, [key]: Number(event.target.value) })}
            />
          </label>
        ))}
        <label>
          집계 기준일{' '}
          <input
            type="date"
            value={rows.asOf ?? ''}
            onChange={(event) => onChange({ ...rows, asOf: event.target.value || null })}
          />
        </label>
      </div>
    </div>
  );
}
