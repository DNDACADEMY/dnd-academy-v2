import api from '@/app/api';
import { getCacheDate } from '@/utils';

import { ONE_HOUR } from '../constants/time';
import { OrganizerCategory } from '../types/organizer';

// eslint-disable-next-line import/prefer-default-export
export async function getOrganizers({ position }: { position?: string; } | undefined = {}) {
  // TODO - 타입 추후 정의
  const response = await api<any[], { date: string; }>({
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
  const response = await api<Record<OrganizerCategory, number>, { date: string; }>({
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
