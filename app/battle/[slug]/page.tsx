import React from 'react';
import { supabase } from '@/lib/supabase';
import { Battle, ScoreSnapshot, EpisodeScore, SuspiciousProfile, AnomalyEvent } from '@/types';
import ScoreChart from '@/components/ScoreChart';
import EpisodeTimeline from '@/components/EpisodeTimeline';
import ProfileEvidence from '@/components/ProfileEvidence';
import Link from 'next/link';

interface BattlePageProps {
  params: {
    slug: string;
  };
}

async function getBattleData(slug: string) {
  const { data: battle } = await supabase
    .from('battles')
    .select(`
      id, slug, is_active, anime_a_id, anime_b_id,
      anime_a:anime_a_id(*),
      anime_b:anime_b_id(*)
    `)
    .eq('slug', slug)
    .single() as { data: Battle | null };

  if (!battle || !battle.anime_a || !battle.anime_b) {
    return { battle: null, chartData: [], episodesA: [], episodesB: [], suspicious: [], anomalies: [] };
  }

  const idA = battle.anime_a_id;
  const idB = battle.anime_b_id;

  const { data: snapshots } = await supabase
    .from('score_snapshots')
    .select('*')
    .in('anime_id', [idA, idB])
    .order('scraped_at', { ascending: true }) as { data: ScoreSnapshot[] | null };

  const { data: epScores } = await supabase
    .from('episode_scores')
    .select('*')
    .in('anime_id', [idA, idB]) as { data: EpisodeScore[] | null };

  const episodesA = epScores?.filter(e => e.anime_id === idA) || [];
  const episodesB = epScores?.filter(e => e.anime_id === idB) || [];

  const { data: suspicious } = await supabase
    .from('suspicious_profiles')
    .select('*')
    .in('anime_id', [idA, idB])
    .order('found_at', { ascending: false }) as { data: SuspiciousProfile[] | null };

  const { data: anomalies } = await supabase
    .from('anomaly_events')
    .select('*')
    .in('anime_id', [idA, idB])
    .order('detected_at', { ascending: false }) as { data: AnomalyEvent[] | null };

  const chartDataMap: { [date: string]: any } = {};
  if (snapshots) {
    snapshots.forEach((snap) => {
      const dateStr = new Date(snap.scraped_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      if (!chartDataMap[dateStr]) {
        chartDataMap[dateStr] = { date: dateStr };
      }
      const prefix = snap.anime_id === idA ? 'a' : 'b';
      chartDataMap[dateStr][`${prefix}_${snap.platform}`] = Number(snap.score);
    });
  }
  const chartData = Object.values(chartDataMap);

  return { 
    battle, 
    chartData, 
    episodesA, 
    episodesB, 
    suspicious: suspicious || [], 
    anomalies: anomalies || [] 
  };
}

export default async function BattlePage({ params }: BattlePageProps) {
  const { slug } = params;
  const { battle, chartData, episodesA, episodesB, suspicious, anomalies } = await getBattleData(slug);

  if (!battle) {
    return (
      <div className="py-24 text-center space-y-4">
        <h1 className="text-2xl font-bold text-text-primary">Comparison Battle Not Found</h1>
        <p className="text-text-secondary">The comparison matrix specified is either private or does not exist.</p>
        <Link href="/" className="text-accent-cyan hover:underline inline-block mt-4">Return Home</Link>
      </div>
    );
  }

  const animeA = battle.anime_a!;
  const animeB = battle.anime_b!;

  return (
    <div className="space-y-16">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-surface flex flex-col md:flex-row min-h-[360px]">
        <div className="flex-1 p-8 md:p-12 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute inset-0 bg-accent-mushoku/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="z-10 space-y-4">
            <span className="inline-flex px-3 py-1 rounded text-xs font-extrabold uppercase tracking-widest bg-accent-mushoku/10 text-accent-mushoku border border-accent-mushoku/20">
              Challenger A
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-text-primary">{animeA.title_english}</h1>
            <p className="text-xs font-mono text-text-secondary">{animeA.title_romaji}</p>
            <p className="text-sm text-text-secondary max-w-md line-clamp-3">{animeA.synopsis}</p>
          </div>
        </div>

        <div className="flex items-center justify-center relative md:absolute md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-25">
          <div className="w-12 h-12 bg-background border-2 border-border text-accent-gold rounded-full flex items-center justify-center font-extrabold text-sm tracking-widest shadow-xl">
            VS
          </div>
        </div>

        <div className="flex-1 p-8 md:p-12 flex flex-col justify-between items-start md:items-end text-left md:text-right relative overflow-hidden group border-t md:border-t-0 md:border-l border-border">
          <div className="absolute inset-0 bg-accent-rezero/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="z-10 space-y-4">
            <span className="inline-flex px-3 py-1 rounded text-xs font-extrabold uppercase tracking-widest bg-accent-rezero/10 text-accent-rezero border border-accent-rezero/20">
              Challenger B
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-text-primary">{animeB.title_english}</h2>
            <p className="text-xs font-mono text-text-secondary">{animeB.title_romaji}</p>
            <p className="text-sm text-text-secondary max-w-md line-clamp-3 md:ml-auto">{animeB.synopsis}</p>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-text-primary">Platform Scoring History</h3>
          <p className="text-sm text-text-secondary mt-1">Comparing tracking fluctuations and divergence indices over time.</p>
        </div>
        <ScoreChart
          data={chartData}
          seriesKeys={['a_anilist', 'b_anilist', 'a_mal', 'b_mal']}
          seriesLabels={{
            a_anilist: `${animeA.title_english} (AL)`,
            b_anilist: `${animeB.title_english} (AL)`,
            a_mal: `${animeA.title_english} (MAL)`,
            b_mal: `${animeB.title_english} (MAL)`
          }}
          colors={{
            a_anilist: '#7c3aed',
            b_anilist: '#06b6d4',
            a_mal: '#c084fc',
            b_mal: '#3b82f6'
          }}
        />
      </section>

      <section className="space-y-12">
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-text-primary">{animeA.title_english} Episode Scores</h3>
            <p className="text-sm text-text-secondary mt-1">Snapshot scores plotted around target episode release dates.</p>
          </div>
          <EpisodeTimeline episodes={episodesA} />
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-text-primary">{animeB.title_english} Episode Scores</h3>
            <p className="text-sm text-text-secondary mt-1">Snapshot scores plotted around target episode release dates.</p>
          </div>
          <EpisodeTimeline episodes={episodesB} />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-2xl font-bold tracking-tight text-text-primary">Score Anomalies</h3>
          <p className="text-sm text-text-secondary">
            Every sudden jump or slide exceeding ±0.30 points generates an audit sweep block below. Our bots crawl user scores matching the timestamp window.
          </p>
          <div className="border border-border rounded-xl bg-surface p-4 text-xs space-y-2">
            <p className="text-accent-gold font-bold">Heuristic Conditions:</p>
            <ul className="list-disc pl-4 text-text-secondary space-y-1">
              <li>Score Delta: &gt;= 0.30 absolute points</li>
              <li>Crawls: Public Reviews feed</li>
              <li>Verification check: Account age & favorites check</li>
            </ul>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="border border-border rounded-xl bg-surface divide-y divide-border">
            {anomalies.length > 0 ? (
              anomalies.map((anom) => {
                const anime = anom.anime_id === animeA.id ? animeA : animeB;
                const delta = anom.score_after - anom.score_before;
                return (
                  <div key={anom.id} className="p-5 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        anom.event_type === 'drop' ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'
                      }`}>
                        {anom.event_type} (Delta: {delta > 0 ? '+' : ''}{delta.toFixed(2)})
                      </span>
                      <h4 className="font-bold text-sm text-text-primary">{anime.title_english}</h4>
                      <p className="text-xs text-text-secondary">Platform: <span className="uppercase">{anom.platform}</span></p>
                    </div>
                    <div className="text-xs font-mono text-text-secondary">
                      {new Date(anom.detected_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-sm text-text-secondary">
                No major deviations detected in historical timelines.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-text-primary">Audited Account Audit logs</h3>
          <p className="text-sm text-text-secondary mt-1">Anonymized logs generated on recent sweeps matching our bad-actors parameters [1].</p>
        </div>
        <ProfileEvidence profiles={suspicious} />
      </section>
    </div>
  );
}
