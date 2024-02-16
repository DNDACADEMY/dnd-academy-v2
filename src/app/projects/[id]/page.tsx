import { notFound } from 'next/navigation';

import ProjectPage from '@/components/pages/ProjectPage';
import { getProject, getProjects } from '@/lib/apis/project';

export const dynamicParams = false;

export async function generateStaticParams() {
  const projects = await getProjects();

  return projects.map(({ id }) => ({
    id: `${id}`,
  }));
}

async function Page({ params }: { params: { id: string; } }) {
  const project = await getProject({ id: Number(params.id) });

  if (!project) {
    notFound();
  }

  return (
    <ProjectPage project={project} />
  );
}

export default Page;
