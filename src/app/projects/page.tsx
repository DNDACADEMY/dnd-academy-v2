import PageTitle from '@/components/molecules/PageTitle';
import ShareAlarmSection from '@/components/molecules/ShareAlarmSection';
import ProjectsPage from '@/components/pages/ProjectsPage';
import getProjects from '@/lib/apis/project';

async function Page() {
  const projects = await getProjects();

  return (
    <>
      <PageTitle title="프로젝트" subTitle="참가자들의 다양한 프로젝트를 확인해 보세요!" />
      <ProjectsPage projects={projects} />
      <ShareAlarmSection />
    </>
  );
}

export default Page;
