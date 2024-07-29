import { api, CurrentApplicantCount } from '@dnd-academy/core';

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
  const currentApplicantCountData = await api<CurrentApplicantCount>({
    url: '/current_applicant_count.json',
    method: 'GET',
  });

  const currentApplicantCount = checkNumber(currentApplicantCountData?.designer)
    + checkNumber(currentApplicantCountData?.developer);

  const eventStatus = getEventStatus();

  return (
    <HomePage
      tab={searchParams.tab}
      currentApplicantCount={currentApplicantCount}
      eventStatus={eventStatus}
    />
  );
}

export default Home;
