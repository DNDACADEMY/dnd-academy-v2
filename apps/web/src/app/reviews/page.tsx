import { Metadata } from 'next';

import ReviewsPage from '@/components/pages/ReviewsPage';
import { getReviews } from '@/lib/apis/review';
import METADATA from '@/lib/constants/metadata';

const title = '후기 - DND';

export const metadata: Metadata = {
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

async function Page({ searchParams }: { searchParams?: Promise<SearchParams>; }) {
  const params = await searchParams;
  const reviews = getReviews({ position: params?.position });

  return (
    <ReviewsPage reviews={reviews} />
  );
}

export default Page;
