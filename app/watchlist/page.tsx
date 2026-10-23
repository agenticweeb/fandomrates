'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type SavedTitle = {
  anime: { id: number; title_english: string | null; title_romaji: string | null; cover_image_url: string | null };
  intent: 'safe' | 'short' | 'wildcard';
  outcome?: 'watched' | 'dropped';
  savedAt: string;
  updatedAt: string;
};

const STORAGE_KEY = 'fandomrates.watchlist.v1';

export default function WatchlistPage() {
  const [items, setItems] = useState<SavedTitle[]>([]);
  useEffect(() => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
      if (Array.isArray(parsed)) setItems(parsed);
    } catch {
      setItems([]);
    }
  }, []);

  function clearAll() {
    window.localStorage.removeItem(STORAGE_KEY);
    setItems([]);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 py-8">
      <header className="rounded-3xl border border-border bg-surface p-6 md:p-10">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-accent-cyan">Your private decision log</p>
        <h1 className="mt-3 text-3xl font-black text-text-primary md:text-5xl">Watchlist with memory</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-text-secondary">Save a title with the reason you considered it. Later, record watched or dropped. FandomRates uses that feedback to make the decision page useful over time instead of asking you to trust another universal score.</p>
      </header>

      {items.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center"><h2 className="text-xl font-black text-text-primary">Nothing saved yet</h2><p className="mt-2 text-sm text-text-secondary">Open an anime evidence page, choose your viewing goal, and save the decision.</p><Link href="/" className="mt-5 inline-flex rounded-xl bg-text-primary px-5 py-3 text-sm font-black text-background">Find an anime</Link></section>
      ) : (
        <section className="space-y-4" aria-labelledby="saved-decisions-heading">
          <div className="flex items-center justify-between gap-4"><h2 id="saved-decisions-heading" className="text-2xl font-black text-text-primary">Saved decisions</h2><button type="button" onClick={clearAll} className="text-xs font-bold text-text-secondary underline hover:text-danger">Clear local log</button></div>
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((item) => <article key={item.anime.id} className="flex gap-4 rounded-2xl border border-border bg-surface p-4"><img src={item.anime.cover_image_url || '/images/fallback-image.svg'} alt="" className="h-28 w-20 rounded-lg object-cover" /><div className="min-w-0 flex-1"><h3 className="font-black text-text-primary">{item.anime.title_english || item.anime.title_romaji || 'Untitled anime'}</h3><p className="mt-1 text-xs text-text-secondary">Goal: {item.intent === 'safe' ? 'safe pick' : item.intent === 'short' ? 'something short' : 'wildcard'}</p><p className="mt-2 text-xs font-bold uppercase tracking-wider text-text-secondary">{item.outcome ? `Outcome: ${item.outcome}` : 'Outcome not recorded'}</p><Link href={`/anime/${item.anime.id}`} className="mt-4 inline-flex text-sm font-semibold text-accent-cyan hover:underline">Reopen evidence →</Link></div></article>)}
          </div>
        </section>
      )}
    </div>
  );
}
