import PageTitle from '@/components/molecules/PageTitle';
import ShareAlarmSection from '@/components/molecules/ShareAlarmSection';
import OrganizersPage from '@/components/pages/OrganizersPage';
import { getOrganizers } from '@/lib/apis/organizer';

type SearchParams = {
  'position': string | undefined;
};

async function Page({ searchParams }: { searchParams?: SearchParams; }) {
  const organizers = await getOrganizers({ position: searchParams?.position });

  return (
    <>
      <PageTitle title="운영진" subTitle="DND활동을 실현하게 한 멤버들을 소개합니다." />
      <OrganizersPage organizers={organizers} />
      <ShareAlarmSection />
    </>
  );
}

export default Page;
