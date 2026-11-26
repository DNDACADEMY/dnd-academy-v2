import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import ProjectPage from '@/components/pages/ProjectPage';
import { getProject } from '@/lib/apis/project';
import METADATA, { DEFAULT_METADATA } from '@/lib/constants/metadata';
import { PUBLIC_ORIGIN } from '@/lib/constants/origin';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const project = await getProject({ id: /^(0|[1-9]\d*)$/.test(params.id) ? Number(params.id) : NaN });

  if (!project) {
    return DEFAULT_METADATA;
  }

  const images = project.thumbnail
    ? [
        {
          url: project.thumbnail,
          width: 800,
          height: 600,
          alt: project.name,
        },
      ]
    : METADATA.images;

  const canonicalUrl = `${PUBLIC_ORIGIN}/projects/${params.id}`;

  return {
    metadataBase: METADATA.metadataBase,
    title: { absolute: `${project.name} - DND` },
    description: project.title,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${project.name} - DND`,
      description: project.title,
      url: canonicalUrl,
      images,
    },
    twitter: {
      title: `${project.name} - DND`,
      description: project.title,
      images,
    },
  };
}

async function Page({ params }: Props) {
  const resolvedParams = await params;
  const project = await getProject({ id: /^(0|[1-9]\d*)$/.test(resolvedParams.id) ? Number(resolvedParams.id) : NaN });

  if (!project) {
    notFound();
  }

  return <ProjectPage project={project} />;
}

export default Page;
