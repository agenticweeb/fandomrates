import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/submit'] },
      { userAgent: 'GPTBot', allow: '/', disallow: ['/api/', '/submit'] },
      { userAgent: 'OAI-SearchBot', allow: '/', disallow: ['/api/', '/submit'] },
    ],
    ...(origin ? { sitemap: `${origin}/sitemap.xml` } : {}),
  };
}
