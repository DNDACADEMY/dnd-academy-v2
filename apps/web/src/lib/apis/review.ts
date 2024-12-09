import type { ProjectFlag, Review, ReviewPosition } from '@dnd-academy/core';

import { reviewsData } from '@/lib/assets/data';
import { ensureNumber, sortFlagsDescending } from '@/utils';

export function getReviews({
  position, flag, projectId,
}: { position?: string; flag?: ProjectFlag; projectId?: number; } | undefined = {}) {
  const reviews = (reviewsData as Review[]).sort((a, b) => sortFlagsDescending(a.flag, b.flag));

  if (flag && projectId) {
    return reviews.filter((
      review,
    ) => review.flag.trim() === flag.trim() && review.projectId === projectId);
  }

  if (!position || position === 'all') {
    return reviews;
  }

  return reviews.filter((review) => review.position === position);
}

export function getReviewCount() {
  const reviews = reviewsData as Review[];

  return reviews.reduce(
    (acc, { position }) => ({
      ...acc,
      [position]: ensureNumber(acc[position]) + 1,
    }),
    {} as Record<ReviewPosition, number>,
  );
}
