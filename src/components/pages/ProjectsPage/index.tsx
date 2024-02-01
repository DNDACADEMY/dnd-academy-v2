'use client';

import { Project } from '@/lib/types/project';

type Props = {
  projects: Project[];
};

function ProjectsPage({ projects }: Props) {
  console.log(projects);

  return (
    <div>ProjectsPage</div>
  );
}

export default ProjectsPage;
