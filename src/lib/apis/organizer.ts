import { organizerCountData, organizerIntroductionData } from '../assets/data';
import { Organizer, OrganizerPosition } from '../types/organizer';

export function getOrganizers({
  position,
}: { position?: string; } | undefined = {}): Organizer[] {
  const organizerIntroduction = organizerIntroductionData as Organizer[];

  if (!position) {
    return [...organizerIntroduction].reverse();
  }

  return organizerIntroduction.filter(({ dndPosition }) => dndPosition === position);
}

export function getOrganizerCount(): Record<OrganizerPosition, number> {
  return organizerCountData;
}
