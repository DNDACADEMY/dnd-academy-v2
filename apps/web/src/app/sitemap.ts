import { MetadataRoute } from 'next';

import { getOrganizers } from '@/lib/apis/organizer';
import { getProjects } from '@/lib/apis/project';

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = process.env.NEXT_PUBLIC_ORIGIN;
  const lastModified = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: origin, lastModified, priority: 1 },
    { url: `${origin}/projects`, lastModified },
    { url: `${origin}/organizers`, lastModified },
    { url: `${origin}/dnd/about`, lastModified },
    { url: `${origin}/dnd/culture`, lastModified },
    { url: `${origin}/reviews`, lastModified },
  ];

  const organizerEntries: MetadataRoute.Sitemap = getOrganizers().map(({ id }) => ({
    url: `${origin}/organizers/${id}`,
    lastModified,
  }));

  const projectEntries: MetadataRoute.Sitemap = getProjects().map(({ id }) => ({
    url: `${origin}/projects/${id}`,
    lastModified,
  }));

  return [...staticEntries, ...organizerEntries, ...projectEntries];
}
