import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import ProjectPage from '@/components/pages/ProjectPage';
import { getProject, getProjects } from '@/lib/apis/project';
import METADATA, { DEFAULT_METADATA } from '@/lib/constants/metadata';

export const dynamicParams = false;

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const project = getProject({ id: Number(params.id) });

  if (!project) {
    return DEFAULT_METADATA;
  }

  const images = project.thumbnail ? [{
    url: project.thumbnail,
    width: 800,
    height: 600,
    alt: project.name,
  }] : METADATA.images;

  return {
    title: `${project.name} - DND`,
    description: project.title,
    openGraph: {
      title: project.name,
      description: project.title,
      url: `${process.env.NEXT_PUBLIC_ORIGIN}/projects/${params.id}`,
      images,
    },
    twitter: {
      title: project.name,
      description: project.title,
      images,
    },
  };
}

export function generateStaticParams() {
  const projects = getProjects();

  return projects.map(({ id }) => ({
    id: String(id),
  }));
}

async function Page({ params }: Props) {
  const resolvedParams = await params;
  const project = getProject({ id: Number(resolvedParams.id) });

  if (!project) {
    notFound();
  }

  return (
    <ProjectPage project={project} />
  );
}

export default Page;
