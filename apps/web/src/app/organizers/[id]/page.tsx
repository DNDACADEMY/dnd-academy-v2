import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import OrganizerPage from '@/components/pages/OrganizerPage';
import { getOrganizer, getOrganizers } from '@/lib/apis/organizer';
import METADATA, { DEFAULT_METADATA } from '@/lib/constants/metadata';

export const dynamicParams = false;

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const organizer = getOrganizer({ id: Number(params.id) });

  if (!organizer) {
    return DEFAULT_METADATA;
  }

  const images = organizer.thumbnail ? [{
    url: organizer.thumbnail,
    width: 800,
    height: 600,
    alt: organizer.name,
  }] : METADATA.images;

  return {
    metadataBase: METADATA.metadataBase,
    title: `${organizer.name} - DND`,
    description: organizer.oneLineIntroduction,
    openGraph: {
      title: organizer.name,
      description: organizer.oneLineIntroduction,
      url: `${process.env.NEXT_PUBLIC_ORIGIN}/organizers/${params.id}`,
      images,
    },
    twitter: {
      title: organizer.name,
      description: organizer.oneLineIntroduction,
      images,
    },
  };
}

export function generateStaticParams() {
  const organizers = getOrganizers();

  return organizers.map(({ id }) => ({
    id: String(id),
  }));
}

async function Page({ params }: Props) {
  const resolvedParams = await params;
  const organizer = getOrganizer({ id: Number(resolvedParams.id) });

  if (!organizer) {
    notFound();
  }

  return (
    <OrganizerPage organizer={organizer} />
  );
}

export default Page;
