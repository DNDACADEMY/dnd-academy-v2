import JobsPage from '@/components/pages/JobsPage';
import { getJobs } from '@/lib/apis/job';

type SearchParams = {
  flag: string | undefined;
};

function Page({ searchParams }: { searchParams?: SearchParams; }) {
  const jobs = getJobs({ flag: searchParams?.flag });

  return (
    <JobsPage jobs={jobs} />
  );
}

export default Page;
