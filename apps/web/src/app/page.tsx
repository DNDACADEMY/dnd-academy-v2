import { api, type FAQ } from '@dnd-academy/core';

import HomePage from '@/components/pages/HomePage';
import { getApplicantCount, getEventStatus } from '@/lib/apis/event';
import { DEFAULT_METADATA } from '@/lib/constants/metadata';

export const metadata = DEFAULT_METADATA;

type ParamsKey = 'tab';

type Props = {
  searchParams: Record<ParamsKey, string | undefined>;
};

async function Home({ searchParams }: Props) {
  const faqData = await api<FAQ[]>({
    url: '/faq.json',
    type: 'blob',
  });

  const eventStatus = getEventStatus();
  const applicantCount = getApplicantCount();

  return (
    <HomePage
      tab={searchParams.tab}
      eventStatus={eventStatus}
      faqItems={faqData}
      applicantTotalCount={applicantCount.total}
    />
  );
}

export default Home;
