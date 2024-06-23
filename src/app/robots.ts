import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/jobs/',
      ],
    },
    sitemap: `${process.env.NEXT_PUBLIC_ORIGIN}/sitemap.xml`,
  };
}
