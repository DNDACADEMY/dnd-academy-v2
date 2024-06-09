import { reviewsData } from '@/lib/assets/data';
import { ProjectFlag } from '@/lib/types/project';
import { Review, ReviewPosition } from '@/lib/types/review';

export function getReviews({
  position, flag, projectId,
}: { position?: string; flag?: ProjectFlag; projectId?: number; } | undefined = {}) {
  const reviews = reviewsData as Review[];

  if (flag && projectId) {
    return reviews.filter((
      review,
    ) => review.flag.trim() === flag.trim() && review.projectId === projectId);
  }

  if (!position) {
    return [...reviews].reverse();
  }

  return reviews.filter((review) => review.position === position);
}

export function getReviewCount() {
  const reviews = reviewsData as Review[];

  return reviews.reduce(
    (acc, { position }) => ({
      ...acc,
      [position]: (acc[position] || 0) + 1,
    }),
    {} as Record<ReviewPosition, number>,
  );
}
