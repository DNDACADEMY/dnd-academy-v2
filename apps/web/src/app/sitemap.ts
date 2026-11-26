import { MetadataRoute } from 'next';

import { getOrganizerDirectory } from '@/lib/apis/organizer';
import { getProjects } from '@/lib/apis/project';
import { PUBLIC_ORIGIN } from '@/lib/constants/origin';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: PUBLIC_ORIGIN, lastModified, priority: 1 },
    { url: `${PUBLIC_ORIGIN}/projects`, lastModified },
    { url: `${PUBLIC_ORIGIN}/organizers`, lastModified },
    { url: `${PUBLIC_ORIGIN}/dnd/about`, lastModified },
    { url: `${PUBLIC_ORIGIN}/dnd/culture`, lastModified },
    { url: `${PUBLIC_ORIGIN}/reviews`, lastModified },
  ];

  const { active, former } = await getOrganizerDirectory();
  const organizerEntries: MetadataRoute.Sitemap = [...active, ...former].map(({ id }) => ({
    url: `${PUBLIC_ORIGIN}/organizers/${id}`,
    lastModified,
  }));

  const projectEntries: MetadataRoute.Sitemap = (await getProjects()).map(({ id }) => ({
    url: `${PUBLIC_ORIGIN}/projects/${id}`,
    lastModified,
  }));

  return [...staticEntries, ...organizerEntries, ...projectEntries];
}
