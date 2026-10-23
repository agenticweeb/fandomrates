import type { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  if (!origin) return [];

  const { data } = await supabase
    .from('anime')
    .select('id, created_at')
    .order('created_at', { ascending: false })
    .limit(500);

  return [
    { url: origin, changeFrequency: 'daily', priority: 1 },
    { url: `${origin}/methodology`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${origin}/battles`, changeFrequency: 'daily', priority: 0.6 },
    ...((data || []).map((anime) => ({
      url: `${origin}/anime/${anime.id}`,
      lastModified: anime.created_at,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }))),
  ];
}
