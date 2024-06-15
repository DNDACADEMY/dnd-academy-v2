import { reviewsData } from '@/lib/assets/data';
import { ProjectFlag } from '@/lib/types/project';
import { Review, ReviewPosition } from '@/lib/types/review';
import { checkNumber, sortFlagsDescending } from '@/utils';

export function getReviews({
  position, flag, projectId,
}: { position?: string; flag?: ProjectFlag; projectId?: number; } | undefined = {}) {
  const reviews = (reviewsData as Review[]).sort((a, b) => sortFlagsDescending(a.flag, b.flag));

  if (flag && projectId) {
    return reviews.filter((
      review,
    ) => review.flag.trim() === flag.trim() && review.projectId === projectId);
  }

  if (!position) {
    return reviews;
  }

  return reviews.filter((review) => review.position === position);
}

export function getReviewCount() {
  const reviews = reviewsData as Review[];

  return reviews.reduce(
    (acc, { position }) => ({
      ...acc,
      [position]: checkNumber(acc[position]) + 1,
    }),
    {} as Record<ReviewPosition, number>,
  );
}
