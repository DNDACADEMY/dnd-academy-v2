import Image from 'next/image';
import Link from 'next/link';

import { OrganizerPosition } from '@/lib/types/organizer';

import styles from './index.module.scss';

type Props = {
  position: OrganizerPosition;
  profile: string;
  name: string;
  technicalStack: string[];
  id: number;
  oneLineIntroduction: string;
};

function OrganizerCard({
  position, oneLineIntroduction, name, technicalStack, profile, id,
}: Props) {
  return (
    <Link className={styles.projectCardWrapper} href={`/organizers/${id}`}>
      <Image src={profile} alt={name} width={271} height={271} className={styles.profile} />
      <div className={styles.contents}>
        <div className={styles.position}>{position}</div>
        <div className={styles.name}>{name}</div>
        <div className={styles.introduction}>{oneLineIntroduction}</div>
        <div className={styles.stackWrapper}>
          {technicalStack.map((stack) => (
            <span key={stack} className={styles.stackItem}>{stack}</span>
          ))}
        </div>
      </div>
    </Link>
  );
}

export default OrganizerCard;
