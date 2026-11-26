import type { Organizer, OrganizerPosition } from '@dnd-academy/core';

import organizersData from '@/lib/assets/data/organizers.json';
import { cmsOrganizers, contentEnabled } from '@/lib/cms/content';
import { ensureNumber } from '@/utils';

export async function getOrganizers({
  position,
  isArchived,
}: { position?: string; isArchived?: boolean } | undefined = {}): Promise<Organizer[]> {
  const organizers = await loadOrganizers();

  const filteredOrganizerIntroduction = organizers.filter((organizer) =>
    typeof isArchived === 'boolean' ? organizer.isArchived === isArchived : true,
  );

  if (!position || position === 'all') {
    return filteredOrganizerIntroduction;
  }

  return filteredOrganizerIntroduction.filter(
    ({ dndPosition }) => dndPosition === position || dndPosition === '마스코트',
  );
}

export async function getOrganizer({ id }: { id: number }) {
  const organizers = await loadOrganizers();

  return organizers.find((project) => project.id === id);
}

export async function getOrganizerCount() {
  const organizers = await loadOrganizers();

  return organizers
    .filter((organizer) => !organizer.isArchived && organizer.dndPosition !== '마스코트')
    .reduce(
      (acc, { dndPosition }) => ({
        ...acc,
        [dndPosition]: ensureNumber(acc[dndPosition]) + 1,
      }),
      {} as Record<OrganizerPosition, number>,
    );
}

async function loadOrganizers(): Promise<Organizer[]> {
  return contentEnabled() ? cmsOrganizers() : (organizersData as Organizer[]);
}
