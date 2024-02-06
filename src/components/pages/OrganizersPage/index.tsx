import OrganizerCard from '@/components/molecules/OraganizerCard';
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
          id, dndPosition, name, technicalStack, oneLineIntroduction, picture,
        }) => (
          <OrganizerCard
            key={id}
            id={id}
            position={dndPosition}
            name={name}
            technicalStack={technicalStack}
            oneLineIntroduction={oneLineIntroduction}
            profile={picture}
          />
        ))}
      </div>
    </>
  );
}

export default OrganizersPage;
