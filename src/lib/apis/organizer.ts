import { organizersData } from '@/lib/assets/data';
import { Organizer, OrganizerPosition } from '@/lib/types/organizer';

export function getOrganizers({
  position, isArchived,
}: { position?: string; isArchived?: boolean; } | undefined = {}): Organizer[] {
  const organizers = organizersData as Organizer[];

  const filteredOrganizerIntroduction = organizers
    .filter((organizer) => (typeof isArchived === 'boolean' ? organizer.isArchived === isArchived : true));

  if (!position) {
    return [...filteredOrganizerIntroduction].reverse();
  }

  return filteredOrganizerIntroduction.filter(({ dndPosition }) => dndPosition === position);
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
      [dndPosition]: (acc[dndPosition] || 0) + 1,
    }),
    {} as Record<OrganizerPosition, number>,
  );
}
