'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Anime, ScoreSnapshot } from '@/types';
import { DecisionIntent, DecisionOutcome, readDecisionLog, upsertDecision } from '@/lib/decisionLog';

interface DecisionBriefProps {
  anime: Anime;
  snapshots: ScoreSnapshot[];
}

export default function DecisionBrief({ anime, snapshots }: DecisionBriefProps) {
  const [intent, setIntent] = useState<DecisionIntent>('safe');
  const [saved, setSaved] = useState(false);
  const [outcome, setOutcome] = useState<DecisionOutcome | undefined>();
  const [hydrated, setHydrated] = useState(false);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    const existing = readDecisionLog().find((item) => item.anime.id === anime.id);
    if (existing) {
      setSaved(true);
      setIntent(existing.intent);
      setOutcome(existing.outcome);
    }
    setHydrated(true);
  }, [anime.id]);

  const evidence = useMemo(() => {
    const latest = new Map<string, ScoreSnapshot>();
    snapshots
      .filter((snapshot) => snapshot.score !== null)
      .sort((a, b) => new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime())
      .forEach((snapshot) => { if (!latest.has(snapshot.platform)) latest.set(snapshot.platform, snapshot); });
    const latestSnapshots = Array.from(latest.values());
    const scores = latestSnapshots.map((snapshot) => Number(snapshot.score)).filter(Number.isFinite);
    const spread = scores.length > 1 ? Math.max(...scores) - Math.min(...scores) : null;
    const newest = latestSnapshots.slice().sort((a, b) => new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime())[0];
    const ageDays = newest ? Math.max(0, Math.floor((Date.now() - new Date(newest.scraped_at).getTime()) / 86400000)) : null;
    return { latestSnapshots, sourceCount: latest.size, spread, ageDays };
  }, [snapshots]);

  const interpretation = intent === 'safe'
    ? evidence.sourceCount < 2
      ? 'Only one source observation is available, so cross-source agreement cannot be assessed. Use the source card below as a starting point, not a confidence signal.'
      : `The latest source scores are ${evidence.spread?.toFixed(2) ?? 'not comparable'} points apart. This is a descriptive difference between source populations, not proof of quality, authenticity, or enjoyment.`
    : intent === 'short'
      ? anime.episodes && anime.episodes <= 13
        ? `The catalog lists ${anime.episodes} episodes. That suggests a smaller commitment, but status, specials, runtime, and missing metadata can change the real time required.`
        : anime.episodes
          ? `The catalog lists ${anime.episodes} episodes, so this is not clearly a short commitment. Confirm format, specials, and airing status before choosing.`
          : 'Episode-count metadata is unavailable, so FandomRates cannot estimate the commitment from this record.'
      : 'You chose an exploratory lens. FandomRates does not know your taste yet; inspect the source disagreement and commitment details as deliberate discovery signals, not proof of hidden quality.';

  function persist(nextOutcome?: DecisionOutcome) {
    const now = new Date().toISOString();
    const existing = readDecisionLog().find((item) => item.anime.id === anime.id);
    const ok = upsertDecision({
      anime: { id: anime.id, title_english: anime.title_english, title_romaji: anime.title_romaji, cover_image_url: anime.cover_image_url },
      intent,
      outcome: nextOutcome ?? outcome,
      savedAt: existing?.savedAt || now,
      updatedAt: now,
    });
    setStorageError(!ok);
    if (ok) {
      setSaved(true);
      if (nextOutcome) setOutcome(nextOutcome);
    }
  }

  return (
    <section className="rounded-3xl border border-accent-cyan/30 bg-gradient-to-br from-accent-cyan/10 via-surface to-surface p-6 md:p-8" aria-labelledby="decision-brief-heading">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-accent-cyan">The reason to use FandomRates</p>
          <h2 id="decision-brief-heading" className="mt-2 text-2xl font-black text-text-primary">Make a more informed next-watch decision</h2>
          <p className="mt-3 text-sm leading-7 text-text-secondary">The source pages tell you their own number. This brief puts source disagreement, freshness, commitment, and missing evidence in one place. It does not predict your enjoyment; it helps you inspect the trade-offs and record what happened.</p>
        </div>
        <div className="min-w-44 rounded-2xl border border-border bg-background/60 p-4 text-sm">
          <p className="text-xs font-black uppercase tracking-wider text-text-secondary">Observed evidence</p>
          <p className="mt-2 font-bold text-text-primary">{evidence.sourceCount} source{evidence.sourceCount === 1 ? '' : 's'} observed</p>
          <p className="mt-1 text-xs text-text-secondary">{evidence.spread === null ? 'No cross-source spread' : `${evidence.spread.toFixed(2)} points apart`}{evidence.ageDays === null ? '' : ` · newest ${evidence.ageDays}d ago`}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3" role="group" aria-label="Choose your viewing goal">
        {([['safe', 'I want less source disagreement', 'Prefer to inspect titles whose latest source values are closer, when two or more observations exist.'], ['short', 'I want something short', 'Prioritize the commitment information available in the catalog.'], ['wildcard', 'I want a wildcard', 'Explore intentionally; this product does not yet know your personal taste pattern.']] as [DecisionIntent, string, string][]).map(([value, label, detail]) => (
          <button key={value} type="button" onClick={() => setIntent(value)} className={`rounded-2xl border p-4 text-left transition ${intent === value ? 'border-accent-cyan bg-accent-cyan/10' : 'border-border bg-background/40 hover:border-text-secondary/50'}`} aria-pressed={intent === value}>
            <span className="block text-sm font-black text-text-primary">{label}</span>
            <span className="mt-1 block text-xs leading-5 text-text-secondary">{detail}</span>
          </button>
        ))}
      </div>

      <p className="mt-5 rounded-2xl border border-border bg-background/40 p-4 text-sm leading-6 text-text-secondary"><strong className="text-text-primary">Reading this title for your goal:</strong> {interpretation}</p>
      <p className="mt-3 text-xs leading-5 text-text-secondary">The spread is a descriptive comparison of the latest available values. It is not a validated confidence interval and does not make unlike communities interchangeable. Open the source cards above for the individual observations.</p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => persist()} className="rounded-xl bg-text-primary px-4 py-3 text-sm font-black text-background">{hydrated && saved ? 'Saved to my watchlist' : 'Save to my watchlist'}</button>
        <button type="button" onClick={() => persist('watched')} className="rounded-xl border border-success/40 px-4 py-3 text-sm font-bold text-success">I watched it</button>
        <button type="button" onClick={() => persist('dropped')} className="rounded-xl border border-border px-4 py-3 text-sm font-bold text-text-secondary">I dropped it</button>
        {outcome && <span className="text-xs font-semibold text-text-secondary">Outcome saved: {outcome}. <Link href="/watchlist" className="text-accent-cyan hover:underline">Review my decisions</Link></span>}
      </div>
      <p className="mt-4 text-xs text-text-secondary">Stored in this browser on this device after you choose an action. It is not encrypted, account-synced, or a public rating. You can export or delete it from My decisions.</p>
      {storageError && <p role="alert" className="mt-3 text-xs font-bold text-danger">This browser did not allow the decision log to be saved. Your source evidence is still available.</p>}
    </section>
  );
}
