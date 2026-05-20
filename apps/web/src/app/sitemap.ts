import { MetadataRoute } from 'next';

import { getOrganizers } from '@/lib/apis/organizer';
import { getProjects } from '@/lib/apis/project';
import { PUBLIC_ORIGIN } from '@/lib/constants/origin';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: PUBLIC_ORIGIN, lastModified, priority: 1 },
    { url: `${PUBLIC_ORIGIN}/projects`, lastModified },
    { url: `${PUBLIC_ORIGIN}/organizers`, lastModified },
    { url: `${PUBLIC_ORIGIN}/dnd/about`, lastModified },
    { url: `${PUBLIC_ORIGIN}/dnd/culture`, lastModified },
    { url: `${PUBLIC_ORIGIN}/reviews`, lastModified },
  ];

  const organizerEntries: MetadataRoute.Sitemap = getOrganizers().map(({ id }) => ({
    url: `${PUBLIC_ORIGIN}/organizers/${id}`,
    lastModified,
  }));

  const projectEntries: MetadataRoute.Sitemap = getProjects().map(({ id }) => ({
    url: `${PUBLIC_ORIGIN}/projects/${id}`,
    lastModified,
  }));

  return [...staticEntries, ...organizerEntries, ...projectEntries];
}
