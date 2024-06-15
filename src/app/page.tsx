import HomePage from '@/components/pages/HomePage';
import { CurrentApplicantCount } from '@/lib/types/count';
import { checkNumber } from '@/utils';

import api from './api';

type ParamsKey = 'tab';

type Props = {
  searchParams: Record<ParamsKey, string | undefined>;
};

async function Home({ searchParams }: Props) {
  const currentApplicantCountData = await api<CurrentApplicantCount>({
    url: '/current_applicant_count-JeSWtPXXi3QyN4jW5IcqsFsWQqsWXA.json',
    method: 'GET',
  });

  const currentApplicantCount = checkNumber(currentApplicantCountData?.designer)
    + checkNumber(currentApplicantCountData?.developer);

  return (
    <HomePage
      tab={searchParams.tab}
      currentApplicantCount={currentApplicantCount}
    />
  );
}

export default Home;
