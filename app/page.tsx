import { supabase } from '@/lib/supabase';
import { Anime, Battle, AnomalyEvent, ScoreSnapshot } from '@/types';
import DashboardContainer from '@/components/DashboardContainer';
import AnimeExplorer from '@/components/AnimeExplorer';

export const dynamic = 'force-dynamic';

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

async function getDashboardData(rawQuery?: string) {
  const query = (rawQuery || '').trim().slice(0, 120);
  const animeQuery = supabase.from('anime').select('*', { count: 'exact' });
  const filteredAnime = query
    ? animeQuery.or(`title_english.ilike.%${escapeLike(query)}%,title_romaji.ilike.%${escapeLike(query)}%`)
    : animeQuery;
  const { data: anime, count, error: animeError } = await filteredAnime
    .order('title_english', { ascending: true, nullsFirst: false })
    .range(0, 23) as { data: Anime[] | null; count: number | null; error: { message: string } | null };
  if (animeError) throw new Error(`Anime catalog query failed: ${animeError.message}`);

  const animeIds = (anime || []).map((item) => item.id);
  const { data: catalogSnapshots, error: catalogSnapshotError } = animeIds.length
    ? await supabase.from('score_snapshots').select('id, anime_id, platform, score, popularity, scraped_at').in('anime_id', animeIds).order('scraped_at', { ascending: false })
    : { data: [], error: null };
  if (catalogSnapshotError) throw new Error(`Catalog score query failed: ${catalogSnapshotError.message}`);

  const { data: battles, error: battlesError } = await supabase
    .from('battles')
    .select('id, slug, is_active, created_at, anime_a:anime_a_id(*), anime_b:anime_b_id(*)')
    .eq('is_active', true) as { data: Battle[] | null; error: { message: string } | null };
  if (battlesError) throw new Error(`Comparison query failed: ${battlesError.message}`);

  const battleAnimeIds = (battles || []).flatMap((battle) => [battle.anime_a_id, battle.anime_b_id]);
  const { data: snapshots, error: snapshotError } = battleAnimeIds.length
    ? await supabase.from('score_snapshots').select('id, anime_id, platform, score, popularity, scraped_at').in('anime_id', battleAnimeIds).order('scraped_at', { ascending: true }).limit(300)
    : { data: [], error: null };
  if (snapshotError) throw new Error(`Comparison score query failed: ${snapshotError.message}`);

  const { data: anomalies, error: anomalyError } = await supabase
    .from('anomaly_events')
    .select('id, anime_id, platform, event_type, score_before, score_after, detected_at, anime:anime_id(title_english, title_romaji)')
    .order('detected_at', { ascending: false })
    .limit(5) as { data: (AnomalyEvent & { anime: { title_english: string; title_romaji: string } })[] | null; error: { message: string } | null };
  if (anomalyError) throw new Error(`Observed-change query failed: ${anomalyError.message}`);

  return {
    anime: anime || [],
    total: count,
    catalogSnapshots: (catalogSnapshots || []) as ScoreSnapshot[],
    battles: battles || [],
    anomalies: anomalies || [],
    snapshots: (snapshots || []) as ScoreSnapshot[],
  };
}

export default async function DashboardPage({ searchParams }: { searchParams?: { q?: string } }) {
  const query = typeof searchParams?.q === 'string' ? searchParams.q : '';
  const { anime, total, catalogSnapshots, battles, anomalies, snapshots } = await getDashboardData(query);

  return (
    <div className="space-y-12">
      <AnimeExplorer anime={anime} snapshots={catalogSnapshots} query={query} total={total} />
      <DashboardContainer battles={battles} anomalies={anomalies} snapshots={snapshots} />
    </div>
  );
}
