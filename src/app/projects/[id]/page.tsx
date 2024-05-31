import { notFound } from 'next/navigation';

import ProjectPage from '@/components/pages/ProjectPage';
import { getProject, getProjects } from '@/lib/apis/project';

export const dynamicParams = false;

export function generateStaticParams() {
  const projects = getProjects();

  return projects.map(({ id }) => ({
    id: `${id}`,
  }));
}

function Page({ params }: { params: { id: string; } }) {
  const project = getProject({ id: Number(params.id) });

  if (!project) {
    notFound();
  }

  return (
    <ProjectPage project={project} />
  );
}

export default Page;
