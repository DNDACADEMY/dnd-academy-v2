import type { Review, ReviewPosition } from '@dnd-academy/core';

import reviewsData from '@/lib/assets/data/reviews.json';
import { cmsReviews, contentEnabled } from '@/lib/cms/content';
import { ensureNumber, sortFlagsDescending } from '@/utils';

export async function getReviews({ position, projectId }: { position?: string; projectId?: number } | undefined = {}) {
  const reviews = [...(await loadReviews())].sort((a, b) => sortFlagsDescending(a.flag, b.flag));

  if (projectId !== undefined) {
    return reviews.filter((review) => review.projectId === projectId);
  }

  if (!position || position === 'all') {
    return reviews;
  }

  return reviews.filter((review) => review.position === position);
}

export async function getReviewCount() {
  const reviews = await loadReviews();

  return reviews.reduce(
    (acc, { position }) => ({
      ...acc,
      [position]: ensureNumber(acc[position]) + 1,
    }),
    {} as Record<ReviewPosition, number>,
  );
}

async function loadReviews(): Promise<Review[]> {
  return contentEnabled() ? cmsReviews() : (reviewsData as Review[]);
}
