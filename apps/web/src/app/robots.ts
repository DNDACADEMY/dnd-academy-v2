import { MetadataRoute } from 'next';

import { PUBLIC_ORIGIN } from '@/lib/constants/origin';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      {
        userAgent: ['OAI-SearchBot', 'GPTBot', 'ClaudeBot', 'Claude-SearchBot', 'PerplexityBot', 'Google-Extended'],
        disallow: ['/submit-content/', '/api/submissions/'],
      },
    ],
    sitemap: `${PUBLIC_ORIGIN}/sitemap.xml`,
  };
}
