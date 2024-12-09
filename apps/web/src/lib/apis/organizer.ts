import type { Organizer, OrganizerPosition } from '@dnd-academy/core';

import { organizersData } from '@/lib/assets/data';
import { ensureNumber } from '@/utils';

export function getOrganizers({
  position, isArchived,
}: { position?: string; isArchived?: boolean; } | undefined = {}): Organizer[] {
  const organizers = organizersData as Organizer[];

  const filteredOrganizerIntroduction = organizers
    .filter((organizer) => (typeof isArchived === 'boolean' ? organizer.isArchived === isArchived : true));

  if (!position || position === 'all') {
    return filteredOrganizerIntroduction;
  }

  return filteredOrganizerIntroduction.filter(({ dndPosition }) => dndPosition === position || dndPosition === '마스코트');
}

export function getOrganizer({ id }: { id: number; }) {
  const organizers = organizersData as Organizer[];

  return organizers.find((project) => project.id === id);
}

export function getOrganizerCount() {
  const organizers = organizersData as Organizer[];

  return organizers.filter((organizer) => !organizer.isArchived && organizer.dndPosition !== '마스코트').reduce(
    (acc, { dndPosition }) => ({
      ...acc,
      [dndPosition]: ensureNumber(acc[dndPosition]) + 1,
    }),
    {} as Record<OrganizerPosition, number>,
  );
}
