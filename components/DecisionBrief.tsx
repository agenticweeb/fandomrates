'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Anime, ScoreSnapshot } from '@/types';

const STORAGE_KEY = 'fandomrates.watchlist.v1';
type Intent = 'safe' | 'short' | 'wildcard';
type Outcome = 'watched' | 'dropped';

interface SavedTitle {
  anime: Pick<Anime, 'id' | 'title_english' | 'title_romaji' | 'cover_image_url'>;
  intent: Intent;
  outcome?: Outcome;
  savedAt: string;
  updatedAt: string;
}

interface DecisionBriefProps {
  anime: Anime;
  snapshots: ScoreSnapshot[];
}

function readSaved(): SavedTitle[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function DecisionBrief({ anime, snapshots }: DecisionBriefProps) {
  const [intent, setIntent] = useState<Intent>('safe');
  const [saved, setSaved] = useState(() => readSaved().some((item) => item.anime.id === anime.id));
  const [outcome, setOutcome] = useState<Outcome | undefined>(() => readSaved().find((item) => item.anime.id === anime.id)?.outcome);

  const evidence = useMemo(() => {
    const latest = new Map<string, ScoreSnapshot>();
    [...snapshots]
      .filter((snapshot) => snapshot.score !== null)
      .sort((a, b) => new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime())
      .forEach((snapshot) => { if (!latest.has(snapshot.platform)) latest.set(snapshot.platform, snapshot); });
    const latestSnapshots = Array.from(latest.values());
    const scores = latestSnapshots.map((snapshot) => Number(snapshot.score)).filter(Number.isFinite);
    const spread = scores.length > 1 ? Math.max(...scores) - Math.min(...scores) : null;
    const newest = latestSnapshots.sort((a, b) => new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime())[0];
    const ageDays = newest ? Math.max(0, Math.floor((Date.now() - new Date(newest.scraped_at).getTime()) / 86400000)) : null;
    return { sourceCount: latest.size, spread, ageDays };
  }, [snapshots]);

  const interpretation = intent === 'safe'
    ? evidence.spread !== null && evidence.spread <= 0.4 ? 'The available sources broadly agree. That makes this a lower-uncertainty pick, not a guarantee of enjoyment.' : 'The sources do not fully agree. Treat the disagreement as a useful trade-off to investigate before choosing.'
    : intent === 'short'
      ? anime.episodes && anime.episodes <= 13 ? 'This fits a short commitment based on the catalog episode count. Check the source and format details before starting.' : 'This is not clearly a short commitment from the available episode metadata.'
      : 'A wildcard is useful when you want something outside your normal pattern. Low popularity or source disagreement can be a reason to inspect—not proof of hidden quality.';

  function persist(nextOutcome?: Outcome) {
    const now = new Date().toISOString();
    const current = readSaved().filter((item) => item.anime.id !== anime.id);
    const entry: SavedTitle = {
      anime: { id: anime.id, title_english: anime.title_english, title_romaji: anime.title_romaji, cover_image_url: anime.cover_image_url },
      intent,
      outcome: nextOutcome ?? outcome,
      savedAt: readSaved().find((item) => item.anime.id === anime.id)?.savedAt || now,
      updatedAt: now,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([entry, ...current]));
    setSaved(true);
    if (nextOutcome) setOutcome(nextOutcome);
  }

  return (
    <section className="rounded-3xl border border-accent-cyan/30 bg-gradient-to-br from-accent-cyan/10 via-surface to-surface p-6 md:p-8" aria-labelledby="decision-brief-heading">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-accent-cyan">The reason to use FandomRates</p>
          <h2 id="decision-brief-heading" className="mt-2 text-2xl font-black text-text-primary">Make a better next-watch decision</h2>
          <p className="mt-3 text-sm leading-7 text-text-secondary">The source pages tell you their own number. This brief makes the disagreement, freshness, commitment, and uncertainty visible, then lets you record whether the choice worked for you. That history is yours and stays in this browser.</p>
        </div>
        <div className="min-w-44 rounded-2xl border border-border bg-background/60 p-4 text-sm">
          <p className="text-xs font-black uppercase tracking-wider text-text-secondary">Evidence check</p>
          <p className="mt-2 font-bold text-text-primary">{evidence.sourceCount} source{evidence.sourceCount === 1 ? '' : 's'} observed</p>
          <p className="mt-1 text-xs text-text-secondary">{evidence.spread === null ? 'Spread unavailable' : `${evidence.spread.toFixed(2)} points apart`}{evidence.ageDays === null ? '' : ` · newest ${evidence.ageDays}d ago`}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3" role="group" aria-label="Choose your viewing goal">
        {([['safe', 'I want a safe pick', 'Prefer agreement and lower uncertainty.'], ['short', 'I want something short', 'Prioritize a smaller commitment.'], ['wildcard', 'I want a wildcard', 'Explore outside my usual pattern.']] as [Intent, string, string][]).map(([value, label, detail]) => (
          <button key={value} type="button" onClick={() => setIntent(value)} className={`rounded-2xl border p-4 text-left transition ${intent === value ? 'border-accent-cyan bg-accent-cyan/10' : 'border-border bg-background/40 hover:border-text-secondary/50'}`} aria-pressed={intent === value}>
            <span className="block text-sm font-black text-text-primary">{label}</span>
            <span className="mt-1 block text-xs leading-5 text-text-secondary">{detail}</span>
          </button>
        ))}
      </div>

      <p className="mt-5 rounded-2xl border border-border bg-background/40 p-4 text-sm leading-6 text-text-secondary"><strong className="text-text-primary">Reading this title for your goal:</strong> {interpretation}</p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => persist()} className="rounded-xl bg-text-primary px-4 py-3 text-sm font-black text-background">{saved ? 'Saved to my watchlist' : 'Save to my watchlist'}</button>
        <button type="button" onClick={() => persist('watched')} className="rounded-xl border border-success/40 px-4 py-3 text-sm font-bold text-success">I watched it</button>
        <button type="button" onClick={() => persist('dropped')} className="rounded-xl border border-border px-4 py-3 text-sm font-bold text-text-secondary">I dropped it</button>
        {outcome && <span className="text-xs font-semibold text-text-secondary">Outcome saved: {outcome}. <Link href="/watchlist" className="text-accent-cyan hover:underline">Review my decisions</Link></span>}
      </div>
      <p className="mt-4 text-xs text-text-secondary">No account is required. Your decision log is stored locally until you clear it. FandomRates does not treat your outcome as a public rating.</p>
    </section>
  );
}
