import { Button } from '@dnd-academy/ui/client';

import OrganizerCards from '@/components/molecules/OrganizerCards';
import Tags from '@/components/molecules/Tags';
import { getOrganizerCount, getOrganizers } from '@/lib/apis/organizer';
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
      <OrganizerCards organizers={organizers} />
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
              fullWidth
              size="large"
              buttonType="secondary"
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
