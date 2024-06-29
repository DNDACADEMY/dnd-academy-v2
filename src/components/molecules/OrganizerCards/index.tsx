import Image from 'next/image';
import Link from 'next/link';

import SkillTag from '@/components/atoms/SkillTag';
import { Organizer } from '@/lib/types/organizer';

import styles from './index.module.scss';

type Props = {
  organizers: Organizer[];
};

function OrganizerCards({ organizers }: Props) {
  return (
    <div className={styles.organizersWrapper}>
      {organizers.map(({
        id, dndPosition, name, technicalStack, oneLineIntroduction, picture, emoji,
      }) => (
        <Link key={id} className={styles.projectCardWrapper} href={`/organizers/${id}`}>
          {emoji ? <div className={styles.emoji}>{emoji}</div> : (
            <Image
              src={picture}
              alt={name}
              width="0"
              height="0"
              sizes="(max-width: 1204px) 50vw, 33vw"
              className={styles.profile}
            />
          )}
          <div className={styles.contents}>
            <div className={styles.position}>{dndPosition}</div>
            <div className={styles.name}>{name}</div>
            <div className={styles.introduction}>{oneLineIntroduction}</div>
            <div className={styles.stackWrapper}>
              {technicalStack.map((stack) => (
                <SkillTag key={stack} skill={stack} color="grey" />
              ))}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default OrganizerCards;
