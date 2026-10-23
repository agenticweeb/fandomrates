'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DECISION_LOG_KEY, DecisionIntent, downloadDecisionLog, readDecisionLog, removeDecision, SavedTitle, writeDecisionLog } from '@/lib/decisionLog';

function goalLabel(intent: DecisionIntent) {
  return intent === 'safe' ? 'less source disagreement' : intent === 'short' ? 'something short' : 'wildcard';
}

export default function WatchlistPage() {
  const [items, setItems] = useState<SavedTitle[]>([]);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    setItems(readDecisionLog());
    setReady(true);
  }, []);

  function clearAll() {
    if (!window.confirm('Delete all locally stored FandomRates decisions from this browser?')) return;
    setStorageError(!writeDecisionLog([]));
    window.localStorage.removeItem(DECISION_LOG_KEY);
    setItems([]);
  }

  function remove(id: number) {
    const ok = removeDecision(id);
    setStorageError(!ok);
    if (ok) setItems((current) => current.filter((item) => item.anime.id !== id));
  }

  function exportLog() {
    downloadDecisionLog(items);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 py-8">
      <header className="rounded-3xl border border-border bg-surface p-6 md:p-10">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-accent-cyan">Your device-local decision log</p>
        <h1 className="mt-3 text-3xl font-black text-text-primary md:text-5xl">Watchlist with memory</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-text-secondary">Save a title with the reason you considered it. Later, record watched or dropped. Today this log is for your own review; FandomRates does not yet use it to change future recommendations or publish a personal profile.</p>
        <p className="mt-3 max-w-2xl text-xs leading-5 text-text-secondary">Stored only in this browser on this device after an explicit action. It is not encrypted or account-synced and may be visible to other users of this browser profile. Export a backup before clearing site data.</p>
      </header>

      {!ready ? <section className="rounded-2xl border border-border bg-surface p-10 text-center text-sm text-text-secondary">Loading your local decision log…</section> : items.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center"><h2 className="text-xl font-black text-text-primary">Nothing saved yet</h2><p className="mt-2 text-sm text-text-secondary">Open an anime evidence page, choose your viewing goal, and save the decision.</p><Link href="/" className="mt-5 inline-flex rounded-xl bg-text-primary px-5 py-3 text-sm font-black text-background">Find an anime</Link></section>
      ) : (
        <section className="space-y-4" aria-labelledby="saved-decisions-heading">
          <div className="flex flex-wrap items-center justify-between gap-4"><h2 id="saved-decisions-heading" className="text-2xl font-black text-text-primary">Saved decisions</h2><div className="flex gap-4 text-xs font-bold text-text-secondary"><button type="button" onClick={exportLog} className="underline hover:text-text-primary">Export JSON</button><button type="button" onClick={clearAll} className="underline hover:text-danger">Delete all</button></div></div>
          {storageError && <p role="alert" className="text-xs font-bold text-danger">Your browser did not allow that storage change.</p>}
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((item) => <article key={item.anime.id} className="flex gap-4 rounded-2xl border border-border bg-surface p-4"><img src={item.anime.cover_image_url || '/images/fallback-image.svg'} alt="" className="h-28 w-20 rounded-lg object-cover" /><div className="min-w-0 flex-1"><h3 className="font-black text-text-primary">{item.anime.title_english || item.anime.title_romaji || 'Untitled anime'}</h3><p className="mt-1 text-xs text-text-secondary">Goal: {goalLabel(item.intent)}</p><p className="mt-2 text-xs font-bold uppercase tracking-wider text-text-secondary">{item.outcome ? `Outcome: ${item.outcome}` : 'Outcome not recorded'}</p><p className="mt-2 text-xs text-text-secondary">Updated {new Date(item.updatedAt).toLocaleDateString()}</p><div className="mt-4 flex flex-wrap gap-3"><Link href={`/anime/${item.anime.id}`} className="text-sm font-semibold text-accent-cyan hover:underline">Reopen evidence →</Link><button type="button" onClick={() => remove(item.anime.id)} className="text-sm font-semibold text-text-secondary underline hover:text-danger">Remove</button></div></div></article>)}
          </div>
        </section>
      )}
    </div>
  );
}
