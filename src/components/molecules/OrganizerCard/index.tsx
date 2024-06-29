import Image from 'next/image';
import Link from 'next/link';

import SkillTag from '@/components/atoms/SkillTag';
import { OrganizerPosition } from '@/lib/types/organizer';

import styles from './index.module.scss';

type Props = {
  position: OrganizerPosition;
  profile: string;
  name: string;
  technicalStack: string[];
  id: number;
  oneLineIntroduction: string;
  emoji?: string;
};

function OrganizerCard({
  position, oneLineIntroduction, name, technicalStack, profile, id, emoji,
}: Props) {
  return (
    <Link className={styles.projectCardWrapper} href={`/organizers/${id}`}>
      {emoji ? <div className={styles.emoji}>{emoji}</div> : (
        <Image src={profile} alt={name} width={271} height={271} className={styles.profile} />
      )}
      <div className={styles.contents}>
        <div className={styles.position}>{position}</div>
        <div className={styles.name}>{name}</div>
        <div className={styles.introduction}>{oneLineIntroduction}</div>
        <div className={styles.stackWrapper}>
          {technicalStack.map((stack) => (
            <SkillTag key={stack} skill={stack} color="grey" />
          ))}
        </div>
      </div>
    </Link>
  );
}

export default OrganizerCard;
