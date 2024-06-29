import ReviewList from '@/components/molecules/ReviewList';
import Tags from '@/components/molecules/Tags';
import { getReviewCount } from '@/lib/apis/review';
import { Review } from '@/lib/types/review';

type Props = {
  reviews: Review[];
};

async function ReviewsPage({ reviews }: Props) {
  const reviewCount = await getReviewCount();

  return (
    <>
      <Tags paramKey="position" route="/reviews" tagCount={reviewCount} />
      <ReviewList hasProjectLink reviews={reviews} />
    </>
  );
}

export default ReviewsPage;
