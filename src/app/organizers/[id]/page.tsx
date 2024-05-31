import { getOrganizers } from '@/lib/apis/organizer';

export const dynamicParams = false;

export function generateStaticParams() {
  const organizers = getOrganizers();

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
