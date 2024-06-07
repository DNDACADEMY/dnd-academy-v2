import { organizerCountData, organizerIntroductionData } from '../assets/data';
import { Organizer, OrganizerPosition } from '../types/organizer';

export function getOrganizers({
  position, isArchived,
}: { position?: string; isArchived?: boolean; } | undefined = {}): Organizer[] {
  const organizerIntroduction = organizerIntroductionData as Organizer[];

  const filteredOrganizerIntroduction = organizerIntroduction
    .filter((organizer) => (typeof isArchived === 'boolean' ? organizer.isArchived === isArchived : true));

  if (!position) {
    return [...filteredOrganizerIntroduction].reverse();
  }

  return filteredOrganizerIntroduction.filter(({ dndPosition }) => dndPosition === position);
}

export function getOrganizer({ id }: { id: number; }) {
  const organizerIntroduction = organizerIntroductionData as Organizer[];

  return organizerIntroduction.find((project) => project.id === id);
}

export function getOrganizerCount(): Record<OrganizerPosition, number> {
  return organizerCountData;
}
