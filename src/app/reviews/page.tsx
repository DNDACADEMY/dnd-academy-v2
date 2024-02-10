import PageTitle from '@/components/molecules/PageTitle';
import ShareAlarmSection from '@/components/molecules/ShareAlarmSection';
import ReviewsPage from '@/components/pages/ReviewsPage';
import { getReviews } from '@/lib/apis/review';

type SearchParams = {
  position: string | undefined;
};

async function Page({ searchParams }: { searchParams?: SearchParams; }) {
  const reviews = await getReviews({ position: searchParams?.position });

  return (
    <>
      <PageTitle title="후기" subTitle="지금 참가자들의 따끈한 후기를 확인해 보세요!" />
      <ReviewsPage reviews={reviews} />
      <ShareAlarmSection />
    </>
  );
}

export default Page;
