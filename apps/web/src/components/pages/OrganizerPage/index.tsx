import type { Organizer } from '@dnd-academy/core';
import { Button } from '@dnd-academy/ui';

import DetailNavigation from '@/components/molecules/DetailNavigation';
import ApplyNotifyButtonGroup from '@/components/organisms/ApplyNotifyButtonGroup';
import OrganizerCards from '@/components/organisms/OrganizerCards';
import { getEventStatus } from '@/lib/apis/event';
import { getOrganizers } from '@/lib/apis/organizer';
import { RightArrowIcon } from '@/lib/assets/icons';

import OrganizerDetails from './details';

import styles from './index.module.scss';

type Props = {
  organizer: Organizer;
};

async function OrganizerPage({ organizer }: Props) {
  const eventStatus = getEventStatus();

  const isMascot = organizer.dndPosition === '마스코트';

  const samePositionOrganizers = (
    await getOrganizers({
      position: isMascot ? undefined : organizer.dndPosition,
      isArchived: false,
    })
  ).filter((samePositionOrganizer) => samePositionOrganizer.id !== organizer.id);

  return (
    <>
      <DetailNavigation
        steps={[
          {
            label: 'DND',
            href: '/dnd/about',
          },
          {
            label: '운영진',
            href: '/organizers',
          },
          {
            label: organizer.name,
          },
        ]}
      />
      <div className={styles.organizerPage}>
        <OrganizerDetails
          organizer={organizer}
          application={
            <ApplyNotifyButtonGroup eventStatus={eventStatus}>
              <Button isAnimated={false} className={styles.applyButton}>
                <RightArrowIcon className={styles.arrowIcon} width={20} height={20} />
              </Button>
            </ApplyNotifyButtonGroup>
          }
        />
        <div className={styles.samePositionOrganizersWrapper}>
          <h3>운영진 더보기</h3>
          <OrganizerCards organizers={samePositionOrganizers} />
        </div>
      </div>
    </>
  );
}

export default OrganizerPage;
