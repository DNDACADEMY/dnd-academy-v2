import Tags from '@/components/molecules/Tags';
import ReviewList from '@/components/organisms/ReviewList';
import { getReviewCount } from '@/lib/apis/review';
import { Review } from '@/lib/types/review';

type Props = {
  reviews: Review[];
};

function ReviewsPage({ reviews }: Props) {
  const reviewCount = getReviewCount();

  return (
    <>
      <Tags paramKey="position" route="/reviews" tagCount={reviewCount} />
      <ReviewList hasProjectLink reviews={reviews} />
    </>
  );
}

export default ReviewsPage;