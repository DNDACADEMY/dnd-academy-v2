import ProjectCards from '@/components/molecules/ProjectCards';
import Tags from '@/components/molecules/Tags';
import { getProjectCount } from '@/lib/apis/project';
import { Project } from '@/lib/types/project';

type Props = {
  projects: Project[];
};

async function ProjectsPage({ projects }: Props) {
  const projectCount = await getProjectCount();

  return (
    <>
      <Tags paramKey="ordinal" route="/projects" tagCount={projectCount} />
      <ProjectCards projects={projects} />
    </>
  );
}

export default ProjectsPage;