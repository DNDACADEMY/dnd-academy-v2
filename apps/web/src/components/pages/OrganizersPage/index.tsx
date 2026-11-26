import type { OrganizerDirectory, OrganizerPosition } from '@dnd-academy/core';
import { Button } from '@dnd-academy/ui';

import Tags from '@/components/molecules/Tags';
import OrganizerCards from '@/components/organisms/OrganizerCards';

import styles from './index.module.scss';

type Props = {
  organizers: OrganizerDirectory['active'];
  former: OrganizerDirectory['former'];
  organizerCount: Record<OrganizerPosition, number>;
};

function OrganizersPage({ organizers, former, organizerCount }: Props) {
  return (
    <>
      <Tags paramKey="position" route="/organizers" tagCount={organizerCount} />
      <OrganizerCards organizers={organizers} />
      {former.length > 0 && (
        <section className={styles.formerSection} aria-labelledby="former-organizers">
          <div className={styles.sectionHeader}>
            <h2 className={styles.title} id="former-organizers">
              DND의 도움을 주신 분들
            </h2>
            <div className={styles.subTitle}>지금까지 DND의 가치 실현을 위해 열정을 바친 멤버를 소개합니다.</div>
          </div>
          <div className={styles.formerOrganizers}>
            {former.map(({ id, name }) => (
              <Button key={id} href={`/organizers/${id}`} fullWidth size="large" buttonType="secondary" rounded>
                {name}
              </Button>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

export default OrganizersPage;
