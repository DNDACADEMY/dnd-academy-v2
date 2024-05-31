import { reviewCountData, reviewsData } from '../assets/data';
import { ProjectFlag } from '../types/project';
import { Review, ReviewPosition } from '../types/review';

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

export function getReviewCount(): Record<ReviewPosition, number> {
  return reviewCountData;
}
