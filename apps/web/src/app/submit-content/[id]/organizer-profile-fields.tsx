import { useId } from 'react';

import { type OrganizerProfileInput, organizerProfileLabels } from '@/lib/cms/submission-contract';

import styles from './submission.module.scss';

export default function OrganizerProfileFields({
  profile,
  onChange,
}: {
  profile: OrganizerProfileInput;
  onChange: (profile: OrganizerProfileInput) => void;
}) {
  const id = useId();
  return (
    <section className={styles.organizerFields} aria-labelledby={id}>
      <h3 id={id}>프로필 상세 정보</h3>
      <label>
        MBTI
        <input
          value={profile.mbti}
          maxLength={30}
          placeholder="예: ISTP"
          onChange={(event) => onChange({ ...profile, mbti: event.target.value })}
        />
      </label>
      {(['now', 'previous'] as const).map((kind) => (
        <label key={kind}>
          {organizerProfileLabels[kind]}
          <textarea
            rows={3}
            maxLength={10000}
            value={profile[kind].join('\n')}
            placeholder="이력 한 건마다 줄을 바꿔 입력하세요"
            onChange={(event) => onChange({ ...profile, [kind]: event.target.value.split('\n') })}
          />
        </label>
      ))}
      {(['role', 'recommendation', 'interests'] as const).map((kind) => (
        <label key={kind}>
          {organizerProfileLabels[kind]}
          <textarea
            rows={4}
            maxLength={10000}
            value={profile[kind]}
            onChange={(event) => onChange({ ...profile, [kind]: event.target.value })}
          />
        </label>
      ))}
    </section>
  );
}
