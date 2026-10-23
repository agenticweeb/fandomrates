import React from 'react';
import { supabase } from '@/lib/supabase';
import { Anime, Battle, AnomalyEvent, ScoreSnapshot } from '@/types';
import DashboardContainer from '@/components/DashboardContainer';
import AnimeExplorer from '@/components/AnimeExplorer';

export const dynamic = 'force-dynamic';

async function getDashboardData() {
  const { data: battles } = await supabase
    .from('battles')
    .select(`
      id, slug, is_active, created_at,
      anime_a:anime_a_id(*),
      anime_b:anime_b_id(*)
    `)
    .eq('is_active', true) as { data: Battle[] | null };

  const { data: anomalies } = await supabase
    .from('anomaly_events')
    .select(`
      id, anime_id, platform, event_type, score_before, score_after, detected_at,
      anime:anime_id(title_english, title_romaji)
    `)
    .order('detected_at', { ascending: false })
    .limit(5) as { data: (AnomalyEvent & { anime: { title_english: string; title_romaji: string } })[] | null };

  // FIX: Changed to ascending: true so the chart plots oldest to newest correctly
  const { data: snapshots } = await supabase
    .from('score_snapshots')
    .select('scraped_at, score, platform, anime_id')
    .order('scraped_at', { ascending: true }) as { data: ScoreSnapshot[] | null };

  const { data: anime } = await supabase
    .from('anime')
    .select('*')
    .order('title_english', { ascending: true }) as { data: Anime[] | null };

  return { battles: battles || [], anomalies: anomalies || [], snapshots: snapshots || [], anime: anime || [] };
}

export default async function DashboardPage() {
  const { battles, anomalies, snapshots, anime } = await getDashboardData();

  return (
    <div className="space-y-12">
      <AnimeExplorer anime={anime} />
      <DashboardContainer battles={battles} anomalies={anomalies} snapshots={snapshots} />
    </div>
  );
}
