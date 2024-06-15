import HomePage from '@/components/pages/HomePage';
import { CurrentApplicantCount } from '@/lib/types/count';

import api from './api';

type ParamsKey = 'tab';

type Props = {
  searchParams: Record<ParamsKey, string | undefined>;
};

async function Home({ searchParams }: Props) {
  const currentApplicantCount = await api<CurrentApplicantCount>({
    url: '/current_applicant_count-JeSWtPXXi3QyN4jW5IcqsFsWQqsWXA.json',
    method: 'GET',
  });

  return (
    <HomePage
      tab={searchParams.tab}
      currentApplicantCount={currentApplicantCount.designer + currentApplicantCount.developer}
    />
  );
}

export default Home;
