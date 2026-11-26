import { MetadataRoute } from 'next';

import { PUBLIC_ORIGIN } from '@/lib/constants/origin';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${PUBLIC_ORIGIN}/sitemap.xml`,
  };
}
