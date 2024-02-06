import Tags from '@/components/molecules/Tags';
import { getOrganizerCount } from '@/lib/apis/organizer';
import { Organizer } from '@/lib/types/organizer';

import styles from './index.module.scss';

type Props = {
  organizers: Organizer[];
};

async function OrganizersPage({ organizers }: Props) {
  const organizerCount = await getOrganizerCount();

  return (
    <>
      <Tags paramKey="position" route="/organizers" tagCount={organizerCount} />
      <div className={styles.organizersWrapper}>
        {organizers.map(({
          id, dndPosition,
        }) => (
          <div key={id}>
            <div>{id}</div>
            <div>{dndPosition}</div>
          </div>
        ))}
      </div>
    </>
  );
}

export default OrganizersPage;
