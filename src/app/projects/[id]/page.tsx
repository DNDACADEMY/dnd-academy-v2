import { getProjects } from '@/lib/apis/project';

export const dynamicParams = false;

export async function generateStaticParams() {
  const projects = await getProjects();

  return projects.map(({ id }) => ({
    id: `${id}`,
  }));
}

function ProjectPage({ params }: { params: { id: number; } }) {
  return (
    <div>{`Project ${params.id}`}</div>
  );
}

export default ProjectPage;
