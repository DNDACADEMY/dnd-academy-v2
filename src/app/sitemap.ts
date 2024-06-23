import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: process.env.NEXT_PUBLIC_ORIGIN,
      lastModified: new Date(),
      priority: 1,
    },
    {
      url: `${process.env.NEXT_PUBLIC_ORIGIN}/projects`,
      lastModified: new Date(),
    },
    {
      url: `${process.env.NEXT_PUBLIC_ORIGIN}/organizers`,
      lastModified: new Date(),
    },
    {
      url: `${process.env.NEXT_PUBLIC_ORIGIN}/dnd/about`,
      lastModified: new Date(),
    },
    {
      url: `${process.env.NEXT_PUBLIC_ORIGIN}/dnd/culture`,
      lastModified: new Date(),
    },
    {
      url: `${process.env.NEXT_PUBLIC_ORIGIN}/reviews`,
      lastModified: new Date(),
    },
  ];
}
