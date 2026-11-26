import { PageTitle } from '@dnd-academy/ui';
import { Metadata } from 'next';

import ShareAlarmSection from '@/components/organisms/ShareAlarmSection';
import OrganizersPage from '@/components/pages/OrganizersPage';
import { filterActiveOrganizers, getOrganizerCount, getOrganizerDirectory } from '@/lib/apis/organizer';
import METADATA from '@/lib/constants/metadata';
import { PUBLIC_ORIGIN } from '@/lib/constants/origin';

const title = '운영진 - DND';

export const metadata: Metadata = {
  metadataBase: METADATA.metadataBase,
  title,
  openGraph: {
    title,
    url: `${PUBLIC_ORIGIN}/organizers`,
    images: METADATA.images,
  },
  twitter: {
    title,
    images: METADATA.images,
  },
};

type SearchParams = {
  position: string | undefined;
};

async function Page({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const params = await searchParams;

  const { active, former } = await getOrganizerDirectory();
  const organizers = filterActiveOrganizers(active, params?.position);

  return (
    <>
      <PageTitle title="운영진" subTitle="DND활동을 실현하게 한 멤버들을 소개합니다." />
      <OrganizersPage organizers={organizers} former={former} organizerCount={getOrganizerCount(active)} />
      <ShareAlarmSection />
    </>
  );
}

export default Page;
