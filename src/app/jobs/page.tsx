import PageTitle from '@/components/atoms/PageTitle';
import JobsPage from '@/components/pages/JobsPage';
import ShareAlarmSection from '@/components/templates/ShareAlarmSection';
import { getJobs } from '@/lib/apis/job';

type SearchParams = {
  flag: string | undefined;
};

function Page({ searchParams }: { searchParams?: SearchParams; }) {
  const jobs = getJobs({ flag: searchParams?.flag });

  return (
    <>
      <PageTitle title="채용" subTitle="지금, 열정이 넘치는 참가자가 가득한 DND의 채용 공고를 확인하세요!" />
      <JobsPage jobs={jobs} />
      <ShareAlarmSection />
    </>
  );
}

export default Page;
