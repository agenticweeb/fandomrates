import Link from 'next/link';
import { Anime, ScoreSnapshot } from '@/types';

interface AnimeExplorerProps {
  anime: Anime[];
  snapshots: ScoreSnapshot[];
  query: string;
  total: number | null;
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

export default function AnimeExplorer({ anime, snapshots, query, total }: AnimeExplorerProps) {
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
        <h1 id="anime-explorer-heading" className="mt-3 max-w-3xl text-3xl font-black leading-tight text-text-primary md:text-5xl">
          Compare anime ratings without losing the source.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-text-secondary">
          Search a title to see each platform&apos;s score, coverage, freshness, and observed changes. FandomRates explains why numbers differ; it does not invent a single “true” rating.
        </p>
        <form action="/" method="get" className="mt-6 flex flex-col gap-3 sm:flex-row">
          <label className="flex-1">
            <span className="sr-only">Search anime by English or romaji title</span>
            <input
              name="q"
              defaultValue={query}
              maxLength={120}
              placeholder="Try: Frieren, Re:Zero, Mushoku Tensei…"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-primary outline-none transition focus-visible:outline-2 focus-visible:outline-accent-cyan"
            />
          </label>
          <button className="rounded-xl bg-text-primary px-6 py-3 text-sm font-black text-background transition hover:bg-accent-cyan" type="submit">Search ratings</button>
          {query && <Link href="/" className="rounded-xl border border-border px-6 py-3 text-center text-sm font-bold text-text-secondary hover:text-text-primary">Clear</Link>}
        </form>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-text-secondary">
          <span className="rounded-full border border-border px-3 py-1">Source-native scores</span>
          <span className="rounded-full border border-border px-3 py-1">Observed timestamps</span>
          <span className="rounded-full border border-border px-3 py-1">No user accusations</span>
        </div>
      </div>

      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-text-primary">{query ? `Search results for “${query}”` : 'Recently indexed anime'}</h2>
          <p className="mt-1 text-sm text-text-secondary">
            {total === null ? `${anime.length} titles shown` : `${total} matching title${total === 1 ? '' : 's'}${total > anime.length ? ` · showing ${anime.length}` : ''}`}
          </p>
        </div>
        <Link href="/methodology" className="hidden text-sm font-semibold text-accent-cyan hover:underline sm:block">How evidence works →</Link>
      </div>

      {anime.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
          <h3 className="font-bold text-text-primary">No title found</h3>
          <p className="mt-2 text-sm text-text-secondary">Try an English title, romaji title, or a shorter search. If a title is missing from the catalog, use Corrections to request a source review.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {anime.map((item) => {
            const latest = latestByPlatform(snapshotsByAnime.get(item.id) || []);
            return (
              <Link key={item.id} href={`/anime/${item.id}`} className="group rounded-2xl border border-border bg-surface p-4 transition hover:border-accent-cyan/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-cyan">
                <div className="flex gap-4">
                  <img src={item.cover_image_url || '/images/fallback-image.svg'} alt="" className="h-24 w-16 rounded-lg object-cover" />
                  <div className="min-w-0">
                    <h3 className="line-clamp-2 font-bold text-text-primary group-hover:text-accent-cyan">{item.title_english || item.title_romaji || 'Untitled anime'}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-text-secondary">{item.title_romaji || 'Alternate title unavailable'}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                      {item.status && <span>{item.status}</span>}
                      {item.season_year && <span>{item.season_year}</span>}
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3">
                  {platforms.map((platform) => <div key={platform} className="min-w-0"><p className="text-[9px] font-black uppercase tracking-wider text-text-secondary">{platform === 'anilist' ? 'AniList' : platform.toUpperCase()}</p><p className="mt-1 truncate text-xs font-black text-accent-cyan">{scoreLabel(latest.get(platform))}</p></div>)}
                </div>
                <p className="mt-3 text-xs text-text-secondary">Open score history and provenance →</p>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
