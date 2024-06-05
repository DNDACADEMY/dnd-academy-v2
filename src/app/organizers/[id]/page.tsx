import { notFound } from 'next/navigation';

import OrganizerPage from '@/components/pages/OrganizerPage';
import { getOrganizer, getOrganizers } from '@/lib/apis/organizer';

export const dynamicParams = false;

export function generateStaticParams() {
  const organizers = getOrganizers();

  return organizers.map(({ id }) => ({
    id: String(id),
  }));
}

function Page({ params }: { params: { id: string; } }) {
  const organizer = getOrganizer({ id: Number(params.id) });

  if (!organizer) {
    notFound();
  }

  return (
    <OrganizerPage organizer={organizer} />
  );
}

export default Page;
