import PageTitle from '@/components/molecules/PageTitle';
import ShareAlarmSection from '@/components/molecules/ShareAlarmSection';
import JobsPage from '@/components/pages/JobsPage';
import { getJobs } from '@/lib/apis/job';

type SearchParams = {
  flag: string | undefined;
};

async function Page({ searchParams }: { searchParams?: SearchParams; }) {
  const jobs = await getJobs({ flag: searchParams?.flag });

  return (
    <>
      <PageTitle title="채용" subTitle="지금, 열정이 넘치는 참가자가 가득한 DND의 채용 공고를 확인하세요!" />
      <JobsPage jobs={jobs} />
      <ShareAlarmSection />
    </>
  );
}

export default Page;
