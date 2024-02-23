import api from '@/app/api';
import { getCacheDate } from '@/utils';

import { ONE_HOUR } from '../constants/time';
import { ProjectFlag } from '../types/project';
import { Review, ReviewPosition } from '../types/review';

export async function getReviews({
  position, flag, projectId,
}: { position?: string; flag?: ProjectFlag; projectId?: number; } | undefined = {}) {
  const response = await api<Review[], { date: string; }>({
    url: '/data/reviews.json',
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

  if (flag && projectId) {
    return response.filter((
      review,
    ) => review.flag.trim() === flag.trim() && review.projectId === projectId);
  }

  if (!position) {
    return [...response].reverse();
  }

  return response.filter((review) => review.position === position);
}

export async function getReviewCount() {
  const response = await api<Record<ReviewPosition, number>, { date: string; }>({
    url: '/data/review_count.json',
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
