import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { Anime, ScoreSnapshot } from '@/types';
import DecisionBrief from '@/components/DecisionBrief';

export const dynamic = 'force-dynamic';

const SOURCE_LABELS: Record<string, string> = { anilist: 'AniList', mal: 'MyAnimeList', kitsu: 'Kitsu' };
const SOURCE_DESCRIPTIONS: Record<string, string> = {
  anilist: 'AniList aggregate observation',
  mal: 'MyAnimeList aggregate observation',
  kitsu: 'Kitsu aggregate observation',
};

function sourceUrl(source: string, anime: Anime) {
  if (source === 'anilist' && anime.anilist_id) return `https://anilist.co/anime/${anime.anilist_id}`;
  if (source === 'mal' && anime.mal_id) return `https://myanimelist.net/anime/${anime.mal_id}`;
  if (source === 'kitsu' && anime.kitsu_id) return `https://kitsu.io/anime/${anime.kitsu_id}`;
  return null;
}

function freshness(snapshot: ScoreSnapshot | undefined) {
  if (!snapshot) return 'No accepted observation';
  const ageDays = Math.max(0, (Date.now() - new Date(snapshot.scraped_at).getTime()) / 86400000);
  if (ageDays <= 7) return 'Fresh · observed within 7 days';
  if (ageDays <= 30) return 'Aging · observed within 30 days';
  return 'Stale · older than 30 days';
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const animeId = Number(params.id);
  if (!Number.isInteger(animeId)) return { title: 'Anime evidence not found | FandomRates', robots: { index: false, follow: false } };
  const { data } = await supabase.from('anime').select('title_english, title_romaji, synopsis').eq('id', animeId).maybeSingle();
  if (!data) return { title: 'Anime evidence not found | FandomRates', robots: { index: false, follow: false } };
  const title = data.title_english || data.title_romaji || 'Anime';
  const description = `Compare ${title} source observations, freshness, missing data, and rating spread without replacing the original platforms.`;
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  return { title: `${title} rating evidence | FandomRates`, description, ...(origin ? { alternates: { canonical: `${origin}/anime/${animeId}` }, openGraph: { title, description, url: `${origin}/anime/${animeId}`, type: 'article' } } : {}) };
}

export default async function AnimeEvidencePage({ params }: { params: { id: string } }) {
  const animeId = Number(params.id);
  if (!Number.isInteger(animeId)) notFound();
  const { data: anime } = await supabase.from('anime').select('*').eq('id', animeId).single() as { data: Anime | null };
  if (!anime) notFound();

  const [{ data: snapshots }, { data: identities }] = await Promise.all([
    supabase.from('score_snapshots').select('*').eq('anime_id', animeId).order('scraped_at', { ascending: false }),
    supabase.from('source_identities').select('source, source_id, canonical_title, confidence, provenance_url, last_seen_at').eq('anime_id', animeId).eq('review_status', 'accepted'),
  ]);
  const typedSnapshots = (snapshots || []) as ScoreSnapshot[];
  const latestBySource = new Map<string, ScoreSnapshot>();
  for (const snapshot of typedSnapshots) if (!latestBySource.has(snapshot.platform)) latestBySource.set(snapshot.platform, snapshot);
  const observed = Array.from(latestBySource.values()).filter((snapshot) => snapshot.score !== null);
  const scores = observed.map((snapshot) => snapshot.score as number);
  const spread = scores.length > 1 ? Math.max(...scores) - Math.min(...scores) : null;
  const title = anime.title_english || anime.title_romaji || 'Untitled anime';
  const aliases = (identities || []).map((identity) => identity.canonical_title).filter(Boolean) as string[];

  return (
    <div className="mx-auto max-w-6xl space-y-10 py-8">
      <Link href="/" className="text-sm font-semibold text-accent-cyan hover:underline">← Back to Explore</Link>
      <header className="rounded-3xl border border-border bg-surface p-6 md:p-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <img src={anime.cover_image_url || '/images/fallback-image.svg'} alt="" className="h-48 w-32 rounded-xl object-cover" />
          <div className="min-w-0 space-y-3">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-accent-cyan">FandomRates evidence receipt</p>
            <h1 className="text-3xl font-black text-text-primary md:text-5xl">{title}</h1>
            <p className="text-sm text-text-secondary">{anime.title_romaji || 'Alternate title unavailable'}</p>
            {aliases.length > 0 && <p className="text-xs leading-5 text-text-secondary">Known source identity: {Array.from(new Set(aliases)).join(' · ')}</p>}
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-text-secondary">
              {anime.status && <span className="rounded-full border border-border px-3 py-1">{anime.status}</span>}
              {anime.season_year && <span className="rounded-full border border-border px-3 py-1">{anime.season_year}</span>}
              {anime.episodes && <span className="rounded-full border border-border px-3 py-1">{anime.episodes} episodes</span>}
              <span className="rounded-full border border-border px-3 py-1">{observed.length} of 3 sources observed</span>
            </div>
          </div>
        </div>
        {anime.synopsis && <p className="mt-8 max-w-4xl text-sm leading-7 text-text-secondary">{anime.synopsis}</p>}
      </header>

      <section className="rounded-2xl border border-accent-cyan/30 bg-accent-cyan/5 p-6" aria-labelledby="receipt-heading">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div><p className="text-xs font-black uppercase tracking-[0.2em] text-accent-cyan">What FandomRates adds</p><h2 id="receipt-heading" className="mt-2 text-2xl font-black text-text-primary">A comparison receipt, not another rating mirror</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary">The original platforms own the ratings. FandomRates keeps their values separate and makes the differences inspectable: which source was observed, when it was observed, what is missing, and how wide the current spread is.</p></div>
          <Link href="/methodology" className="shrink-0 text-sm font-bold text-accent-cyan hover:underline">Read methodology →</Link>
        </div>
        <div className="mt-5 grid gap-3 text-sm md:grid-cols-3"><div className="rounded-xl border border-border bg-surface p-4"><p className="text-xs font-bold uppercase text-text-secondary">Observed</p><p className="mt-2 font-bold text-text-primary">{observed.length} source value{observed.length === 1 ? '' : 's'}</p><p className="mt-1 text-xs text-text-secondary">Read directly from named source snapshots.</p></div><div className="rounded-xl border border-border bg-surface p-4"><p className="text-xs font-bold uppercase text-text-secondary">Calculated</p><p className="mt-2 font-bold text-text-primary">{spread === null ? 'Spread unavailable' : `${spread.toFixed(2)} points`}</p><p className="mt-1 text-xs text-text-secondary">Maximum minus minimum across observed sources only.</p></div><div className="rounded-xl border border-border bg-surface p-4"><p className="text-xs font-bold uppercase text-text-secondary">Freshness</p><p className="mt-2 font-bold text-text-primary">{observed.length ? freshness(observed.sort((a, b) => new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime())[0]) : 'No accepted snapshots'}</p><p className="mt-1 text-xs text-text-secondary">A stale or missing value is never replaced by another source.</p></div></div>
      </section>

      <DecisionBrief anime={anime} snapshots={typedSnapshots} />

      <section className="space-y-4" aria-labelledby="source-ratings-heading">
        <div><h2 id="source-ratings-heading" className="text-2xl font-black text-text-primary">Source-native observations</h2><p className="mt-1 text-sm text-text-secondary">These cards are intentionally separate. Different platforms may have different populations, eligibility rules, update timing, and missingness.</p></div>
        <div className="grid gap-4 md:grid-cols-3">
          {['anilist', 'mal', 'kitsu'].map((source) => {
            const snapshot = latestBySource.get(source);
            const link = sourceUrl(source, anime);
            const identity = (identities || []).find((item) => item.source === source);
            return <article key={source} className="rounded-2xl border border-border bg-surface p-5"><div className="flex items-center justify-between gap-3"><h3 className="font-black uppercase tracking-wider text-text-primary">{SOURCE_LABELS[source]}</h3><span className="rounded-full border border-border px-2 py-1 text-[10px] font-bold uppercase text-text-secondary">{snapshot ? (freshness(snapshot).split(' · ')[0]) : 'Unavailable'}</span></div><p className="mt-2 text-xs text-text-secondary">{SOURCE_DESCRIPTIONS[source]}</p>{snapshot ? <><p className="mt-6 text-4xl font-black text-accent-cyan">{snapshot.score?.toFixed(2) ?? '—'}<span className="text-base text-text-secondary"> / 10</span></p><dl className="mt-5 space-y-2 text-xs text-text-secondary"><div className="flex justify-between gap-3"><dt>Popularity / count</dt><dd>{snapshot.popularity ?? 'Unavailable'}</dd></div><div className="flex justify-between gap-3"><dt>Observed</dt><dd>{new Date(snapshot.scraped_at).toLocaleString('en-US')}</dd></div></dl></> : <p className="mt-6 text-sm leading-6 text-text-secondary">No accepted observation is available for this source. FandomRates does not estimate it from another platform.</p>}{(link || identity?.provenance_url) && <a href={identity?.provenance_url || link || '#'} target="_blank" rel="noreferrer" className="mt-5 inline-block text-xs font-bold text-accent-cyan hover:underline">Open {SOURCE_LABELS[source]} ↗</a>}</article>;
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-background/50 p-6"><h2 className="text-lg font-black text-text-primary">How to use the difference</h2><div className="mt-4 grid gap-4 text-sm leading-6 text-text-secondary md:grid-cols-3"><p><strong className="text-text-primary">Inspect timing.</strong> A value observed today and one observed weeks ago are not the same freshness state.</p><p><strong className="text-text-primary">Inspect missingness.</strong> One source having no accepted observation is a data-status fact, not a zero rating.</p><p><strong className="text-text-primary">Inspect spread.</strong> A difference tells you where to investigate; it does not prove which community is right or why the difference happened.</p></div></section>
    </div>
  );
}
