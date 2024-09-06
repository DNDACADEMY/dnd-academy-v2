import {
  api, type CurrentApplicantCount, type FAQ, getLatestItemReduce,
} from '@dnd-academy/core';
import { list } from '@vercel/blob';

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
  const { blobs: currentApplicantCountBlobs } = await list({
    prefix: 'current_applicant_count',
    token: process.env.DND_ACADEMY_V2_BLOB_READ_WRITE_TOKEN,
  });

  const { blobs: faqBlobs } = await list({
    prefix: 'faq',
    token: process.env.DND_ACADEMY_V2_BLOB_READ_WRITE_TOKEN,
  });

  const latestCurrentApplicantCountBlob = getLatestItemReduce(currentApplicantCountBlobs);
  const latestFAQBlob = getLatestItemReduce(faqBlobs);

  const currentApplicantCountData = await api<CurrentApplicantCount>({
    url: latestCurrentApplicantCountBlob.url,
    method: 'GET',
  });

  const faqData = await api<FAQ[]>({
    url: latestFAQBlob.url,
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
      faqItems={faqData}
    />
  );
}

export default Home;
