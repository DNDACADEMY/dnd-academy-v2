import { api, type FAQ } from '@dnd-academy/core';

import HomePage from '@/components/pages/HomePage';
import { getApplicantCount, getEventStatus } from '@/lib/apis/event';
import { contentEnabled } from '@/lib/cms/content';
import { homePresentation, publishedHome } from '@/lib/cms/home';
import { DEFAULT_METADATA } from '@/lib/constants/metadata';

export const metadata = DEFAULT_METADATA;

type ParamsKey = 'tab';

type Props = {
  searchParams: Promise<Record<ParamsKey, string | undefined>>;
};

async function Home({ searchParams }: Props) {
  const params = await searchParams;

  const published = contentEnabled() ? await publishedHome() : null;
  const home = published ? await homePresentation(published) : undefined;
  const faqData =
    home?.faqs ??
    (process.env.NEXT_PUBLIC_VERCEL_BLOB_HOST
      ? await api<FAQ[]>({
          url: '/faq.json',
          type: 'blob',
        }).catch(() => [])
      : []);

  const eventStatus = getEventStatus();
  const applicantCount = getApplicantCount();

  return (
    <HomePage
      tab={params.tab}
      eventStatus={eventStatus}
      faqItems={faqData}
      content={home}
      applicantTotalCount={applicantCount.total}
    />
  );
}

export default Home;
