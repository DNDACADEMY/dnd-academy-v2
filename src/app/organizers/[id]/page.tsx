import { getOrganizers } from '@/lib/apis/organizer';

export const dynamicParams = false;

export async function generateStaticParams() {
  const organizers = await getOrganizers();

  return organizers.map(({ id }) => ({
    id: `${id}`,
  }));
}

function OrganizersPage({ params }: { params: { id: number; } }) {
  return (
    <div>{`organizer ${params.id}`}</div>
  );
}

export default OrganizersPage;
