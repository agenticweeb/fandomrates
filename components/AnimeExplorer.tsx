"use client";

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Anime } from '@/types';

interface AnimeExplorerProps {
  anime: Anime[];
}

export default function AnimeExplorer({ anime }: AnimeExplorerProps) {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!normalizedQuery) return anime.slice(0, 12);
    return anime.filter((item) =>
      [item.title_english, item.title_romaji]
        .filter(Boolean)
        .some((title) => title!.toLowerCase().includes(normalizedQuery))
    ).slice(0, 24);
  }, [anime, normalizedQuery]);

  return (
    <section className="space-y-5" aria-labelledby="anime-explorer-heading">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 id="anime-explorer-heading" className="text-2xl font-black uppercase tracking-wider text-text-primary">Explore anime</h2>
          <p className="mt-1 text-sm text-text-secondary">Search the canonical catalog. Every score needs a source, timestamp, and coverage context.</p>
        </div>
        <label className="w-full md:max-w-sm">
          <span className="sr-only">Search anime by title</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search English or romaji title"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none transition focus-visible:outline-2 focus-visible:outline-accent-cyan"
          />
        </label>
      </div>
      {results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-sm text-text-secondary">
          No canonical title matches this search. Try an alternate title or request a source correction.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((item) => (
            <Link
              key={item.id}
              href={`/anime/${item.id}`}
              className="group rounded-2xl border border-border bg-surface p-4 transition hover:border-accent-cyan/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-cyan"
            >
              <div className="flex gap-4">
                <img
                  src={item.cover_image_url || '/images/fallback-image.svg'}
                  alt=""
                  className="h-24 w-16 rounded-lg object-cover"
                />
                <div className="min-w-0">
                  <h3 className="line-clamp-2 font-bold text-text-primary group-hover:text-accent-cyan">{item.title_english || item.title_romaji || 'Untitled anime'}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-text-secondary">{item.title_romaji || 'Alternate title unavailable'}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                    {item.status && <span>{item.status}</span>}
                    {item.season_year && <span>{item.season_year}</span>}
                  </div>
                </div>
              </div>
              <p className="mt-4 text-xs text-text-secondary">Open source-native ratings and provenance →</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
