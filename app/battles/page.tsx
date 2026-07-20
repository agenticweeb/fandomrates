import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Battle, AnomalyEvent } from '@/types';

interface BattleListAnomaly extends AnomalyEvent {
  anime?: {
    title_english: string | null;
    title_romaji: string | null;
  } | null;
}

async function getBattlesPageData() {
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
    .limit(8) as { data: BattleListAnomaly[] | null };

  return { battles: battles || [], anomalies: anomalies || [] };
}

export default async function BattlesPage() {
  const { battles, anomalies } = await getBattlesPageData();

  return (
    <div className="space-y-10 py-6">
      <section className="rounded-3xl border border-border bg-surface p-8 shadow-xl">
        <div className="max-w-3xl space-y-4">
          <span className="inline-flex rounded-full border border-accent-cyan/30 bg-accent-cyan/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-accent-cyan">
            Battle Rooms
          </span>
          <h1 className="text-3xl font-black uppercase tracking-tight text-text-primary md:text-4xl">
            Focused rooms for every live campaign.
          </h1>
          <p className="text-sm leading-relaxed text-text-secondary">
            Each room collects the latest score movement, anomaly signals, and episode-level evidence in a cleaner, easier-to-scan view.
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black uppercase tracking-wider text-text-primary">Live battle rooms</h2>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-text-secondary">
              {battles.length} active
            </span>
          </div>

          <div className="space-y-4">
            {battles.map((battle) => {
              const animeA = battle.anime_a;
              const animeB = battle.anime_b;

              if (!animeA || !animeB) return null;

              return (
                <div key={battle.id} className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-text-secondary">
                        Campaign room
                      </p>
                      <h3 className="text-lg font-black text-text-primary">
                        {animeA.title_english || animeA.title_romaji} vs {animeB.title_english || animeB.title_romaji}
                      </h3>
                      <p className="text-sm text-text-secondary">
                        Jump into the dedicated comparison page for score history, recent reviews, and episode evidence.
                      </p>
                    </div>
                    <Link
                      href={`/battle/${battle.slug}`}
                      className="inline-flex items-center justify-center rounded-lg bg-text-primary px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-background transition hover:bg-text-primary/90"
                    >
                      Open room
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="text-lg font-black uppercase tracking-wider text-text-primary">Latest signals</h2>
          <div className="mt-4 space-y-3">
            {anomalies.length > 0 ? (
              anomalies.map((anomaly) => (
                <div key={anomaly.id} className="rounded-xl border border-border/70 bg-background/70 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] ${anomaly.event_type === 'drop' ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                      {anomaly.event_type}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-text-secondary">{anomaly.platform}</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-text-primary">
                    {anomaly.anime?.title_english || anomaly.anime?.title_romaji || 'Tracked title'}
                  </p>
                  <p className="mt-1 text-xs text-text-secondary">
                    {anomaly.score_before.toFixed(2)} → {anomaly.score_after.toFixed(2)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-text-secondary">No recent anomalies have been recorded yet.</p>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}
