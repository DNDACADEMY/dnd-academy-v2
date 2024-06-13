import Button from '@/components/atoms/Button';
import OrganizerCard from '@/components/molecules/OrganizerCard';
import Tags from '@/components/molecules/Tags';
import { getOrganizerCount, getOrganizers } from '@/lib/apis/organizer';
import { LinkIcon } from '@/lib/assets/icons';
import { Organizer } from '@/lib/types/organizer';

import styles from './index.module.scss';

type Props = {
  organizers: Organizer[];
};

function OrganizersPage({ organizers }: Props) {
  const organizerCount = getOrganizerCount();
  const archivedOrganizer = getOrganizers({ isArchived: true });

  return (
    <>
      <Tags paramKey="position" route="/organizers" tagCount={organizerCount} />
      <section className={styles.organizersWrapper}>
        {organizers.map(({
          id, dndPosition, name, technicalStack, oneLineIntroduction, picture, emoji,
        }) => (
          <OrganizerCard
            key={id}
            id={id}
            position={dndPosition}
            name={name}
            technicalStack={technicalStack}
            oneLineIntroduction={oneLineIntroduction}
            profile={picture}
            emoji={emoji}
          />
        ))}
      </section>
      <section className={styles.archivedOrganizerSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.title}>DND의 도움을 주신 분들</h3>
          <div className={styles.subTitle}>지금까지 DND의 가치 실현을 위해 열정을 바친 멤버를 소개합니다.</div>
        </div>
        <div className={styles.archivedOrganizers}>
          {archivedOrganizer.map(({ id, name }) => (
            <Button
              key={id}
              href={id ? `/organizers/${id}` : '#'}
              size="large"
              buttonType="secondary"
              suffixIcon={<LinkIcon width={20} height={20} className={styles.linkIcon} />}
              rounded
            >
              {name}
            </Button>
          ))}
        </div>
      </section>
    </>
  );
}

export default OrganizersPage;
