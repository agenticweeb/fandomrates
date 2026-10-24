'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Anime, ScoreSnapshot } from '@/types';

interface AnimeExplorerProps {
  anime: Anime[];
  snapshots: ScoreSnapshot[];
  query: string;
  total: number | null;
  warnings: string[];
}

interface SourceSearchResult {
  source: string;
  sourceId: number;
  title: string;
  alternateTitle: string | null;
  score: number | null;
  popularity: number | null;
  coverImageUrl: string | null;
  sourceUrl: string;
}

const platforms = ['anilist', 'mal', 'kitsu'] as const;

function latestByPlatform(snapshots: ScoreSnapshot[]) {
  const latest = new Map<string, ScoreSnapshot>();
  for (const snapshot of [...snapshots].sort((a, b) => new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime())) {
    if (snapshot.score !== null && !latest.has(snapshot.platform)) latest.set(snapshot.platform, snapshot);
  }
  return latest;
}

function scoreLabel(snapshot?: ScoreSnapshot) {
  if (!snapshot || snapshot.score === null) return 'Unavailable';
  return `${snapshot.score.toFixed(2)} / 10`;
}

export default function AnimeExplorer({ anime, snapshots, query, total, warnings }: AnimeExplorerProps) {
  const [sourceResults, setSourceResults] = useState<SourceSearchResult[]>([]);
  const [sourceSearchLoading, setSourceSearchLoading] = useState(false);
  const [sourceSearchUnavailable, setSourceSearchUnavailable] = useState(false);

  useEffect(() => {
    if (!query || anime.length > 0) {
      setSourceResults([]);
      setSourceSearchLoading(false);
      setSourceSearchUnavailable(false);
      return;
    }
    const controller = new AbortController();
    setSourceSearchLoading(true);
    setSourceSearchUnavailable(false);
    fetch(`/api/catalog-search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((payload: { results?: SourceSearchResult[]; unavailable?: boolean }) => {
        setSourceResults(payload.results || []);
        setSourceSearchUnavailable(Boolean(payload.unavailable));
      })
      .catch((error: unknown) => {
        if ((error as { name?: string }).name !== 'AbortError') setSourceSearchUnavailable(true);
      })
      .finally(() => setSourceSearchLoading(false));
    return () => controller.abort();
  }, [anime.length, query]);

  const snapshotsByAnime = new Map<number, ScoreSnapshot[]>();
  for (const snapshot of snapshots) {
    const rows = snapshotsByAnime.get(snapshot.anime_id) || [];
    rows.push(snapshot);
    snapshotsByAnime.set(snapshot.anime_id, rows);
  }

  return (
    <section className="space-y-6" aria-labelledby="anime-explorer-heading">
      <div className="rounded-3xl border border-border bg-surface p-6 md:p-10">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-accent-cyan">Anime rating evidence explorer</p>
        <h1 id="anime-explorer-heading" className="mt-3 max-w-3xl text-3xl font-black leading-tight text-text-primary md:text-5xl">Choose your next anime with source-native evidence.</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-text-secondary">Search a title to see each platform&apos;s score, coverage, freshness, and observed changes. FandomRates explains why numbers differ; it does not invent a single “true” rating.</p>
        <form action="/" method="get" className="mt-6 flex flex-col gap-3 sm:flex-row">
          <label className="flex-1">
            <span className="sr-only">Search anime by English, romaji, or native title</span>
            <input name="q" defaultValue={query} maxLength={120} placeholder="Try: Frieren, Re:Zero, Lord of Mysteries…" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-primary outline-none transition focus-visible:outline-2 focus-visible:outline-accent-cyan" />
          </label>
          <button className="rounded-xl bg-text-primary px-6 py-3 text-sm font-black text-background transition hover:bg-accent-cyan" type="submit">Search ratings</button>
          {query && <Link href="/" className="rounded-xl border border-border px-6 py-3 text-center text-sm font-bold text-text-secondary hover:text-text-primary">Clear</Link>}
        </form>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-text-secondary"><span className="rounded-full border border-border px-3 py-1">Source-native scores</span><span className="rounded-full border border-border px-3 py-1">Observed timestamps</span><span className="rounded-full border border-border px-3 py-1">No user accusations</span></div>
      </div>

      <div className="flex items-end justify-between gap-4"><div><h2 className="text-2xl font-black text-text-primary">{query ? `Search results for “${query}”` : 'Recently indexed anime'}</h2><p className="mt-1 text-sm text-text-secondary">{total === null ? `${anime.length} titles shown` : `${total} matching title${total === 1 ? '' : 's'}${total > anime.length ? ` · showing ${anime.length}` : ''}`}</p></div><Link href="/methodology" className="hidden text-sm font-semibold text-accent-cyan hover:underline sm:block">How evidence works →</Link></div>

      {warnings.length > 0 && <div role="status" className="rounded-2xl border border-accent-cyan/30 bg-accent-cyan/10 p-4 text-sm leading-6 text-text-secondary"><strong className="text-text-primary">Some evidence is temporarily unavailable.</strong><ul className="mt-1 list-disc pl-5">{warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div>}

      {anime.length === 0 && query && <div className="rounded-2xl border border-accent-cyan/30 bg-surface p-6"><h3 className="font-bold text-text-primary">Not indexed in FandomRates yet</h3><p className="mt-2 text-sm leading-6 text-text-secondary">We searched the local evidence catalog and are checking the source catalog now. A source match is useful for discovery, but it does not yet have a FandomRates evidence page.</p>{sourceSearchLoading && <p className="mt-4 text-sm font-semibold text-accent-cyan">Searching AniList…</p>}{sourceSearchUnavailable && <p className="mt-4 text-sm text-text-secondary">The source catalog could not be reached. Try again, browse recently indexed titles, or request an index review.</p>}{sourceResults.length > 0 && <div className="mt-5 grid gap-3 sm:grid-cols-2">{sourceResults.map((result) => <div key={`${result.source}-${result.sourceId}`} className="flex gap-3 rounded-xl border border-border bg-background p-3"><img src={result.coverImageUrl || '/images/fallback-image.svg'} alt="" className="h-20 w-14 rounded-md object-cover" /><div className="min-w-0"><h4 className="font-bold text-text-primary">{result.title}</h4>{result.alternateTitle && <p className="mt-1 text-xs text-text-secondary">{result.alternateTitle}</p>}<p className="mt-2 text-xs text-text-secondary">{result.score === null ? 'Score unavailable' : `${result.source} ${result.score.toFixed(2)} / 10`}{result.popularity ? ` · ${result.popularity.toLocaleString()} popularity` : ''}</p><div className="mt-2 flex gap-3 text-xs font-bold"><a href={result.sourceUrl} target="_blank" rel="noreferrer" className="text-accent-cyan hover:underline">Open source ↗</a><Link href="/submit" className="text-text-secondary hover:text-text-primary">Request index</Link></div></div></div>)}</div>}</div>}

      {anime.length === 0 && !query ? <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center"><h3 className="font-bold text-text-primary">The catalog is empty</h3><p className="mt-2 text-sm text-text-secondary">The ingestion job has not published titles yet. Try again later or check the source health status.</p></div> : anime.length === 0 && query && !sourceSearchLoading && sourceResults.length === 0 && !sourceSearchUnavailable ? <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center"><h3 className="font-bold text-text-primary">No source match found</h3><p className="mt-2 text-sm text-text-secondary">Try the native or romaji title, a shorter phrase, or request a catalog review.</p></div> : null}

      {anime.length > 0 && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{anime.map((item) => { const latest = latestByPlatform(snapshotsByAnime.get(item.id) || []); return <Link key={item.id} href={`/anime/${item.id}`} className="group rounded-2xl border border-border bg-surface p-4 transition hover:border-accent-cyan/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-cyan"><div className="flex gap-4"><img src={item.cover_image_url || '/images/fallback-image.svg'} alt="" className="h-24 w-16 rounded-lg object-cover" /><div className="min-w-0"><h3 className="line-clamp-2 font-bold text-text-primary group-hover:text-accent-cyan">{item.title_english || item.title_romaji || 'Untitled anime'}</h3><p className="mt-1 line-clamp-2 text-xs text-text-secondary">{item.title_romaji || 'Alternate title unavailable'}</p><div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider text-text-secondary">{item.status && <span>{item.status}</span>}{item.season_year && <span>{item.season_year}</span>}</div></div></div><div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3">{platforms.map((platform) => <div key={platform} className="min-w-0"><p className="text-[9px] font-black uppercase tracking-wider text-text-secondary">{platform === 'anilist' ? 'AniList' : platform.toUpperCase()}</p><p className="mt-1 truncate text-xs font-black text-accent-cyan">{scoreLabel(latest.get(platform))}</p></div>)}</div><p className="mt-3 text-xs text-text-secondary">Open evidence summary →</p></Link>; })}</div>}
    </section>
  );
}
