import { notFound } from 'next/navigation';

import {
  api, type CurrentApplicantCount, type FAQ, serverErrorHandling,
} from '@dnd-academy/core';

import HomePage from '@/components/pages/HomePage';
import { getEventStatus } from '@/lib/apis/event';
import { DEFAULT_METADATA } from '@/lib/constants/metadata';
import { checkNumber } from '@/utils';

export const metadata = DEFAULT_METADATA;

type ParamsKey = 'tab';

type Props = {
  searchParams: Record<ParamsKey, string | undefined>;
};

async function Home({ searchParams }: Props) {
  const currentApplicantCountData = await serverErrorHandling(() => api<CurrentApplicantCount>({
    url: '/blob/latest/current_applicant_count',
    type: 'bff',
  }));

  const faqData = await serverErrorHandling(() => api<FAQ[]>({
    url: '/blob/latest/faq',
    type: 'bff',
  }));

  if (!currentApplicantCountData || !faqData) {
    notFound();
  }

  const currentApplicantCount = checkNumber(currentApplicantCountData?.designer)
    + checkNumber(currentApplicantCountData?.developer);

  const eventStatus = getEventStatus();

  return (
    <HomePage
      tab={searchParams.tab}
      currentApplicantCount={currentApplicantCount}
      eventStatus={eventStatus}
      faqItems={faqData}
    />
  );
}

export default Home;
