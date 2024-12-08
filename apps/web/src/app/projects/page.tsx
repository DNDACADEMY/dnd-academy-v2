import { PageTitle } from '@dnd-academy/ui';

import ShareAlarmSection from '@/components/organisms/ShareAlarmSection';
import ProjectsPage from '@/components/pages/ProjectsPage';
import { getProjects } from '@/lib/apis/project';
import METADATA from '@/lib/constants/metadata';

const title = '프로젝트 - DND';

export const metadata = {
  metadataBase: METADATA.metadataBase,
  title,
  openGraph: {
    title,
    url: `${process.env.NEXT_PUBLIC_ORIGIN}/projects`,
    images: METADATA.images,
  },
  twitter: {
    title,
    images: METADATA.images,
  },
};

type SearchParams = {
  ordinal: string | undefined;
};

async function Page({ searchParams }: { searchParams?: Promise<SearchParams>; }) {
  const params = await searchParams;
  const projects = getProjects({ ordinal: params?.ordinal });

  return (
    <>
      <PageTitle title="프로젝트" subTitle="참가자들의 다양한 프로젝트를 확인해 보세요!" />
      <ProjectsPage projects={projects} />
      <ShareAlarmSection />
    </>
  );
}

export default Page;
