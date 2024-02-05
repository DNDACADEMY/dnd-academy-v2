import Tags from '@/components/molecules/Tags';
import { getOrganizerCount } from '@/lib/apis/organizer';

import styles from './index.module.scss';

type Props = {
  // TODO - 추후 타입 정의
  organizers: any[];
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
