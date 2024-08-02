import type { Project } from '@dnd-academy/core';

import Tags from '@/components/molecules/Tags';
import ProjectCards from '@/components/organisms/ProjectCards';
import { getProjectCount } from '@/lib/apis/project';

type Props = {
  projects: Project[];
};

function ProjectsPage({ projects }: Props) {
  const projectCount = getProjectCount();

  return (
    <>
      <Tags paramKey="ordinal" route="/projects" tagCount={projectCount} />
      <ProjectCards projects={projects} />
    </>
  );
}

export default ProjectsPage;
