import api from '@/app/api';
import { getCacheDate } from '@/utils';

import { ONE_HOUR } from '../constants/time';
import { Job } from '../types/job';

// eslint-disable-next-line import/prefer-default-export
export async function getJobs({ flag }: { flag?: string; } | undefined = {}) {
  const response = await api<Job[], { date: string; }>({
    url: '/data/jobs.json',
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

  if (!flag) {
    return [...response].reverse();
  }

  return response.filter((review) => review.flag === flag);
}
