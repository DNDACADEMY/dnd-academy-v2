import type { Organizer, OrganizerCard, OrganizerDirectory, OrganizerPosition } from '@dnd-academy/core';
import { cache } from 'react';

import organizersData from '@/lib/assets/data/organizers.json';
import { cmsOrganizer, cmsOrganizerDirectory, contentEnabled } from '@/lib/cms/content';

type LegacyOrganizer = Omit<Organizer, 'activityStatus'> & { isArchived: boolean };
const legacyOrganizers: LegacyOrganizer[] = organizersData as LegacyOrganizer[];

export const getOrganizerDirectory = cache(async (): Promise<OrganizerDirectory> => {
  if (contentEnabled()) return cmsOrganizerDirectory();

  const directory: OrganizerDirectory = { active: [], former: [] };
  for (const {
    id,
    name,
    isArchived,
    thumbnail,
    dndPosition,
    technicalStack,
    oneLineIntroduction,
    emoji,
  } of legacyOrganizers) {
    if (isArchived) {
      directory.former.push({ id, name });
    } else {
      directory.active.push({ id, name, thumbnail, dndPosition, technicalStack, oneLineIntroduction, emoji });
    }
  }
  return directory;
});

export function filterActiveOrganizers(organizers: OrganizerCard[], position?: string): OrganizerCard[] {
  if (!position || position === 'all') return organizers;
  return organizers.filter(({ dndPosition }) => dndPosition === position || dndPosition === '마스코트');
}

export function getOrganizer({ id }: { id: number }) {
  if (!Number.isInteger(id) || id < 0 || id > 2147483647) return undefined;
  if (contentEnabled()) return cmsOrganizer(id);

  const row = legacyOrganizers.find((organizer) => organizer.id === id);
  if (!row) return undefined;
  const { isArchived, ...organizer } = row;
  return { ...organizer, activityStatus: isArchived ? 'former' : 'active' } satisfies Organizer;
}

export function getOrganizerCount(organizers: OrganizerCard[]) {
  const counts = {} as Record<OrganizerPosition, number>;
  for (const { dndPosition } of organizers) {
    if (dndPosition !== '마스코트') counts[dndPosition] = (counts[dndPosition] ?? 0) + 1;
  }
  return counts;
}
