import PageTitle from '@/components/atoms/PageTitle';
import OrganizersPage from '@/components/pages/OrganizersPage';
import ShareAlarmSection from '@/components/templates/ShareAlarmSection';
import { getOrganizers } from '@/lib/apis/organizer';

type SearchParams = {
  position: string | undefined;
};

function Page({ searchParams }: { searchParams?: SearchParams; }) {
  const organizers = getOrganizers({ position: searchParams?.position });

  return (
    <>
      <PageTitle title="운영진" subTitle="DND활동을 실현하게 한 멤버들을 소개합니다." />
      <OrganizersPage organizers={organizers} />
      <ShareAlarmSection />
    </>
  );
}

export default Page;
