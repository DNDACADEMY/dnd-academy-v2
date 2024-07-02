import PageTitle from '@/components/atoms/PageTitle';
import ReviewsPage from '@/components/pages/ReviewsPage';
import ShareAlarmSection from '@/components/templates/ShareAlarmSection';
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
    <>
      <PageTitle title="후기" subTitle="지금 참가자들의 따끈한 후기를 확인해 보세요!" />
      <ReviewsPage reviews={reviews} />
      <ShareAlarmSection />
    </>
  );
}

export default Page;
