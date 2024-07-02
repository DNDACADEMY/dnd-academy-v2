import PageTitle from '@/components/atoms/PageTitle';
import OrganizersPage from '@/components/pages/OrganizersPage';
import ShareAlarmSection from '@/components/templates/ShareAlarmSection';
import { getOrganizers } from '@/lib/apis/organizer';
import METADATA from '@/lib/constants/metadata';

const title = '운영진 - DND';

export const metadata = {
  metadataBase: METADATA.metadataBase,
  title,
  openGraph: {
    title,
    url: `${process.env.NEXT_PUBLIC_ORIGIN}/organizers`,
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

function Page({ searchParams }: { searchParams?: SearchParams; }) {
  const organizers = getOrganizers({ position: searchParams?.position, isArchived: false });

  return (
    <>
      <PageTitle title="운영진" subTitle="DND활동을 실현하게 한 멤버들을 소개합니다." />
      <OrganizersPage organizers={organizers} />
      <ShareAlarmSection />
    </>
  );
}

export default Page;
