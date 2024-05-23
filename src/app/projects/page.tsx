import PageTitle from '@/components/molecules/PageTitle';
import ProjectsPage from '@/components/pages/ProjectsPage';
import ShareAlarmSection from '@/components/templates/ShareAlarmSection';
import { getProjects } from '@/lib/apis/project';

type SearchParams = {
  ordinal: string | undefined;
};

async function Page({ searchParams }: { searchParams?: SearchParams; }) {
  const projects = await getProjects({ ordinal: searchParams?.ordinal });

  return (
    <>
      <PageTitle title="프로젝트" subTitle="참가자들의 다양한 프로젝트를 확인해 보세요!" />
      <ProjectsPage projects={projects} />
      <ShareAlarmSection />
    </>
  );
}

export default Page;
