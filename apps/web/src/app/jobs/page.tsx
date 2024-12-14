import JobsPage from '@/components/pages/JobsPage';
import { getJobs } from '@/lib/apis/job';

type SearchParams = {
  flag: string | undefined;
};

async function Page({ searchParams }: { searchParams?: Promise<SearchParams>; }) {
  const params = await searchParams;

  const jobs = getJobs({ flag: params?.flag });

  return (
    <JobsPage jobs={jobs} />
  );
}

export default Page;
