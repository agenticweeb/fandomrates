import React from 'react';
import { supabase } from '@/lib/supabase';
import { Battle, AnomalyEvent, ScoreSnapshot } from '@/types';
import Link from 'next/link';
import DataFreshnessBadge from '@/components/DataFreshnessBadge';

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

  const { data: snapshots } = await supabase
    .from('score_snapshots')
    .select('scraped_at, score, platform, anime_id')
    .order('scraped_at', { ascending: false }) as { data: ScoreSnapshot[] | null };

  const latestScrapedAt = snapshots && snapshots.length > 0 ? snapshots[0].scraped_at : null;

  return { battles: battles || [], anomalies: anomalies || [], snapshots: snapshots || [], latestScrapedAt };
}

export default async function DashboardPage() {
  const { battles, anomalies, snapshots, latestScrapedAt } = await getDashboardData();

  const getLatestScore = (animeId: number, platform: string) => {
    const found = snapshots.find(s => s.anime_id === animeId && s.platform === platform);
    return found ? found.score : null;
  };

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-surface to-background border border-border p-8 md:p-12">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent-mushoku/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-rezero/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
        
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-accent-gold/10 text-accent-gold border border-accent-gold/20">
            ✦ Anime Rating Integrity Index
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-text-primary leading-tight">
            The Truth Behind <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan to-accent-mushoku">Anime Rating Scores</span>
          </h1>
          <p className="text-base md:text-lg text-text-secondary">
            Tracking ratings across multiple platform databases to flag, parse, and verify scoring irregularities, fan-base campaigns, and coordinated review-bombs.
          </p>
          <div className="pt-4 border-t border-border/50">
            <DataFreshnessBadge scrapedAt={latestScrapedAt} />
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">Active Comparison Battles</h2>
          <span className="text-xs text-text-secondary bg-surface border border-border px-3 py-1 rounded-full">
            Currently tracking {battles.length} active metrics
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {battles.map((battle) => {
            const animeA = battle.anime_a;
            const animeB = battle.anime_b;
            if (!animeA || !animeB) return null;

            const scoreA_AL = getLatestScore(animeA.id, 'anilist');
            const scoreB_AL = getLatestScore(animeB.id, 'anilist');
            const scoreA_MAL = getLatestScore(animeA.id, 'mal');
            const scoreB_MAL = getLatestScore(animeB.id, 'mal');

            return (
              <div 
                key={battle.id}
                className="group relative border border-border rounded-2xl bg-surface overflow-hidden hover:border-text-secondary/20 transition-all duration-300 animate-fade-in"
              >
                <div className="absolute top-0 left-0 w-2 h-full bg-accent-mushoku"></div>
                
                <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-5 flex items-center gap-4">
                    <img 
                      src={animeA.cover_image_url || "/fallback.jpg"} 
                      alt={animeA.title_english || "Anime A"} 
                      className="w-16 h-24 rounded-lg object-cover shadow-md border border-border/60"
                    />
                    <div>
                      <h3 className="font-bold text-lg text-text-primary line-clamp-1">{animeA.title_english}</h3>
                      <p className="text-xs text-text-secondary font-mono mb-2">{animeA.title_romaji}</p>
                      <div className="flex gap-4">
                        <div className="text-xs">
                          <span className="text-text-secondary mr-1">AL:</span>
                          <span className="font-bold text-accent-cyan">{scoreA_AL ? scoreA_AL.toFixed(2) : "N/A"}</span>
                        </div>
                        <div className="text-xs">
                          <span className="text-text-secondary mr-1">MAL:</span>
                          <span className="font-bold text-accent-gold">{scoreA_MAL ? scoreA_MAL.toFixed(2) : "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2 flex flex-col items-center justify-center text-center">
                    <span className="text-sm font-extrabold text-text-secondary/40 tracking-widest uppercase mb-1">VS</span>
                    <div className="h-0.5 w-12 bg-border"></div>
                  </div>

                  <div className="lg:col-span-5 flex items-center lg:flex-row-reverse gap-4 text-left lg:text-right">
                    <img 
                      src={animeB.cover_image_url || "/fallback.jpg"} 
                      alt={animeB.title_english || "Anime B"} 
                      className="w-16 h-24 rounded-lg object-cover shadow-md border border-border/60"
                    />
                    <div>
                      <h3 className="font-bold text-lg text-text-primary line-clamp-1">{animeB.title_english}</h3>
                      <p className="text-xs text-text-secondary font-mono mb-2">{animeB.title_romaji}</p>
                      <div className="flex gap-4 lg:justify-end">
                        <div className="text-xs">
                          <span className="text-text-secondary mr-1">AL:</span>
                          <span className="font-bold text-accent-cyan">{scoreB_AL ? scoreB_AL.toFixed(2) : "N/A"}</span>
                        </div>
                        <div className="text-xs">
                          <span className="text-text-secondary mr-1">MAL:</span>
                          <span className="font-bold text-accent-gold">{scoreB_MAL ? scoreB_MAL.toFixed(2) : "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border bg-surface-elevated/40 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <span className="text-xs text-text-secondary">Tracked historical metadata timeline initialized</span>
                  <Link 
                    href={`/battle/${battle.slug}`} 
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-background bg-text-primary hover:bg-text-primary/95 transition-all text-center justify-center"
                  >
                    Enter Battle Arena
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">Recent Irregular Audits</h2>
        <div className="border border-border rounded-2xl bg-surface divide-y divide-border">
          {anomalies.length > 0 ? (
            anomalies.map((anomaly) => (
              <div key={anomaly.id} className="p-5 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                      anomaly.event_type === 'drop' ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'
                    }`}>
                      {anomaly.event_type} Flagged
                    </span>
                    <span className="text-xs font-bold text-text-secondary uppercase">{anomaly.platform}</span>
                  </div>
                  <h4 className="font-bold text-text-primary">
                    {anomaly.anime?.title_english || anomaly.anime?.title_romaji || "Tracked Title"}
                  </h4>
                  <p className="text-xs text-text-secondary">
                    Audited snapshot shifting from {anomaly.score_before.toFixed(2)} down to {anomaly.score_after.toFixed(2)}
                  </p>
                </div>
                <div className="text-xs text-text-secondary text-left md:text-right font-mono">
                  {new Date(anomaly.detected_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-sm text-text-secondary">
              No sudden drops or spikes exceeding ±0.30 registered on recent runs.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
