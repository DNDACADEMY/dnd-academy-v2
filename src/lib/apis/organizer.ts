import api from '@/app/api';
import { getCacheDate } from '@/utils';

import { ONE_HOUR } from '../constants/time';
import { Organizer, OrganizerPosition } from '../types/organizer';

export async function getOrganizers({ position }: { position?: string; } | undefined = {}) {
  const response = await api<Organizer[], { date: string; }>({
    url: '/data/organizer_introduction.json',
    type: 'public',
    method: 'GET',
    params: {
      ...getCacheDate(),
    },
    config: {
      next: {
        revalidate: ONE_HOUR,
      },
    },
  });

  if (!position) {
    return [...response].reverse();
  }

  return response.filter(({ dndPosition }) => dndPosition === position);
}

export async function getOrganizerCount() {
  const response = await api<Record<OrganizerPosition, number>, { date: string; }>({
    url: '/data/organizer_count.json',
    type: 'public',
    method: 'GET',
    params: {
      ...getCacheDate(),
    },
    config: {
      next: {
        revalidate: ONE_HOUR,
      },
    },
  });

  return response;
}
