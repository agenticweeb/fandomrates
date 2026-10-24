import { supabase } from '@/lib/supabase';
import { Anime, Battle, AnomalyEvent, ScoreSnapshot } from '@/types';
import DashboardContainer from '@/components/DashboardContainer';
import AnimeExplorer from '@/components/AnimeExplorer';

export const dynamic = 'force-dynamic';

type AnimeQueryResult = {
  data: Anime[] | null;
  count: number | null;
  error: { message: string } | null;
};

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

async function getDashboardData(rawQuery?: string) {
  const query = (rawQuery || '').trim().slice(0, 120);
  const warnings: string[] = [];
  let anime: Anime[] = [];
  let count: number | null = null;

  if (!query) {
    const result = await supabase.from('anime').select('*', { count: 'exact' }).order('title_english', { ascending: true, nullsFirst: false }).range(0, 23) as AnimeQueryResult;
    if (result.error) throw new Error(`Anime catalog query failed: ${result.error.message}`);
    anime = result.data || [];
    count = result.count;
  } else {
    const escapedQuery = `%${escapeLike(query)}%`;
    const [englishResult, romajiResult] = await Promise.all([
      supabase.from('anime').select('*', { count: 'exact' }).ilike('title_english', escapedQuery).order('title_english', { ascending: true, nullsFirst: false }).range(0, 23) as unknown as Promise<AnimeQueryResult>,
      supabase.from('anime').select('*', { count: 'exact' }).ilike('title_romaji', escapedQuery).order('title_english', { ascending: true, nullsFirst: false }).range(0, 23) as unknown as Promise<AnimeQueryResult>,
    ]);
    if (englishResult.error || romajiResult.error) {
      const message = englishResult.error?.message || romajiResult.error?.message || 'unknown search error';
      throw new Error(`Anime catalog query failed: ${message}`);
    }
    const unique = new Map<number, Anime>();
    [...(englishResult.data || []), ...(romajiResult.data || [])].forEach((item) => unique.set(item.id, item));
    anime = Array.from(unique.values()).sort((a, b) => (a.title_english || a.title_romaji || '').localeCompare(b.title_english || b.title_romaji || '')).slice(0, 24);
    count = unique.size;
  }

  const animeIds = anime.map((item) => item.id);
  let catalogSnapshots: ScoreSnapshot[] = [];
  if (animeIds.length) {
    const result = await supabase.from('score_snapshots').select('id, anime_id, platform, score, popularity, scraped_at').in('anime_id', animeIds).order('scraped_at', { ascending: false });
    if (result.error) {
      console.error('FandomRates catalog score query failed', result.error);
      warnings.push('Current source scores are temporarily unavailable. The catalog is still searchable.');
    } else {
      catalogSnapshots = (result.data || []) as ScoreSnapshot[];
    }
  }

  let battles: Battle[] = [];
  const battleResult = await supabase.from('battles').select('id, anime_a_id, anime_b_id, slug, is_active, created_at, anime_a:anime_a_id(*), anime_b:anime_b_id(*)').eq('is_active', true) as { data: Battle[] | null; error: { message: string } | null };
  if (battleResult.error) {
    console.error('FandomRates comparison query failed', battleResult.error);
    warnings.push('Comparisons are temporarily unavailable.');
  } else {
    battles = battleResult.data || [];
  }

  const battleAnimeIds = battles.flatMap((battle) => [battle.anime_a_id, battle.anime_b_id]);
  let snapshots: ScoreSnapshot[] = [];
  if (battleAnimeIds.length) {
    const result = await supabase.from('score_snapshots').select('id, anime_id, platform, score, popularity, scraped_at').in('anime_id', battleAnimeIds).order('scraped_at', { ascending: true }).limit(300);
    if (result.error) {
      console.error('FandomRates comparison score query failed', result.error);
      warnings.push('Comparison score history is temporarily unavailable.');
    } else {
      snapshots = (result.data || []) as ScoreSnapshot[];
    }
  }

  let anomalies: (AnomalyEvent & { anime: { title_english: string; title_romaji: string } })[] = [];
  const anomalyResult = await supabase.from('anomaly_events').select('id, anime_id, platform, event_type, score_before, score_after, detected_at, anime:anime_id(title_english, title_romaji)').order('detected_at', { ascending: false }).limit(5) as { data: (AnomalyEvent & { anime: { title_english: string; title_romaji: string } })[] | null; error: { message: string } | null };
  if (anomalyResult.error) {
    console.error('FandomRates observed-change query failed', anomalyResult.error);
    warnings.push('Observed score changes are temporarily unavailable.');
  } else {
    anomalies = anomalyResult.data || [];
  }

  return { anime, total: count, catalogSnapshots, battles, anomalies, snapshots, warnings };
}

export default async function DashboardPage({ searchParams }: { searchParams?: { q?: string } }) {
  const query = typeof searchParams?.q === 'string' ? searchParams.q : '';
  const { anime, total, catalogSnapshots, battles, anomalies, snapshots, warnings } = await getDashboardData(query);

  return (
    <div className="space-y-12">
      <AnimeExplorer anime={anime} snapshots={catalogSnapshots} query={query} total={total} warnings={warnings} />
      <DashboardContainer battles={battles} anomalies={anomalies} snapshots={snapshots} />
    </div>
  );
}
