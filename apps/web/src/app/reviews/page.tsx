import ReviewsPage from '@/components/pages/ReviewsPage';
import { getReviews } from '@/lib/apis/review';
import METADATA from '@/lib/constants/metadata';

const title = '후기 - DND';

export const metadata = {
  metadataBase: METADATA.metadataBase,
  title,
  openGraph: {
    title,
    url: `${process.env.NEXT_PUBLIC_ORIGIN}/reviews`,
    images: METADATA.images,
  },
  twitter: {
    title,
    images: METADATA.images,
  },
};

type SearchParams = {
  position: string | undefined;
};

function Page({ searchParams }: { searchParams?: SearchParams; }) {
  const reviews = getReviews({ position: searchParams?.position });

  return (
    <ReviewsPage reviews={reviews} />
  );
}

export default Page;
