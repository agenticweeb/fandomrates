import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { Anime, ScoreSnapshot } from '@/types';
import DecisionBrief from '@/components/DecisionBrief';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const animeId = Number(params.id);
  if (!Number.isInteger(animeId)) return { title: 'Anime evidence not found | FandomRates', robots: { index: false, follow: false } };
  const { data } = await supabase.from('anime').select('title_english, title_romaji, synopsis').eq('id', animeId).maybeSingle();
  if (!data) return { title: 'Anime evidence not found | FandomRates', robots: { index: false, follow: false } };
  const title = data.title_english || data.title_romaji || 'Anime';
  const description = `See ${title} source ratings, score history, freshness, and evidence context across anime platforms.`;
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  return { title: `${title} rating history and evidence | FandomRates`, description, ...(origin ? { alternates: { canonical: `${origin}/anime/${animeId}` }, openGraph: { title, description, url: `${origin}/anime/${animeId}`, type: 'article' } } : {}) };
}

export default async function AnimeEvidencePage({ params }: { params: { id: string } }) {
  const animeId = Number(params.id);
  if (!Number.isInteger(animeId)) notFound();

  const { data: anime } = await supabase.from('anime').select('*').eq('id', animeId).single() as { data: Anime | null };
  if (!anime) notFound();

  const { data: snapshots } = await supabase
    .from('score_snapshots')
    .select('*')
    .eq('anime_id', animeId)
    .order('scraped_at', { ascending: false }) as { data: ScoreSnapshot[] | null };

  const latestBySource = new Map<string, ScoreSnapshot>();
  for (const snapshot of snapshots || []) {
    if (!latestBySource.has(snapshot.platform)) latestBySource.set(snapshot.platform, snapshot);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10 py-8">
      <Link href="/" className="text-sm font-semibold text-accent-cyan hover:underline">← Back to Explore</Link>
      <header className="rounded-3xl border border-border bg-surface p-6 md:p-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <img src={anime.cover_image_url || '/images/fallback-image.svg'} alt="" className="h-48 w-32 rounded-xl object-cover" />
          <div className="space-y-3">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-accent-cyan">Canonical anime evidence page</p>
            <h1 className="text-3xl font-black text-text-primary md:text-5xl">{anime.title_english || anime.title_romaji}</h1>
            <p className="text-sm text-text-secondary">{anime.title_romaji}</p>
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-text-secondary">
              {anime.status && <span className="rounded-full border border-border px-3 py-1">{anime.status}</span>}
              {anime.season_year && <span className="rounded-full border border-border px-3 py-1">{anime.season_year}</span>}
              <span className="rounded-full border border-border px-3 py-1">Source-native observations</span>
            </div>
          </div>
        </div>
        {anime.synopsis && <p className="mt-8 max-w-4xl text-sm leading-7 text-text-secondary">{anime.synopsis}</p>}
      </header>

      <DecisionBrief anime={anime} snapshots={snapshots || []} />

      <section className="space-y-4" aria-labelledby="source-ratings-heading">
        <div>
          <h2 id="source-ratings-heading" className="text-2xl font-black text-text-primary">Source ratings</h2>
          <p className="mt-1 text-sm text-text-secondary">These values are kept separate because platforms may measure different populations, scales, and update schedules.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {['anilist', 'mal', 'kitsu'].map((source) => {
            const snapshot = latestBySource.get(source);
            return (
              <article key={source} className="rounded-2xl border border-border bg-surface p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-black uppercase tracking-wider text-text-primary">{source}</h3>
                  <span className="rounded-full border border-border px-2 py-1 text-[10px] font-bold uppercase text-text-secondary">{snapshot ? 'Observed' : 'Unavailable'}</span>
                </div>
                {snapshot ? (
                  <>
                    <p className="mt-6 text-4xl font-black text-accent-cyan">{snapshot.score?.toFixed(2) ?? '—'}<span className="text-base text-text-secondary"> / 10</span></p>
                    <dl className="mt-5 space-y-2 text-xs text-text-secondary">
                      <div className="flex justify-between gap-3"><dt>Popularity / count</dt><dd>{snapshot.popularity ?? 'Unavailable'}</dd></div>
                      <div className="flex justify-between gap-3"><dt>Observed</dt><dd>{new Date(snapshot.scraped_at).toLocaleString('en-US')}</dd></div>
                    </dl>
                  </>
                ) : (
                  <p className="mt-6 text-sm leading-6 text-text-secondary">This source has no accepted observation for this title. No value is estimated from another platform.</p>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-background/50 p-6">
        <h2 className="text-lg font-black text-text-primary">How to read this page</h2>
        <div className="mt-4 grid gap-4 text-sm leading-6 text-text-secondary md:grid-cols-3">
          <p><strong className="text-text-primary">Observed</strong> means the value was returned by the named source during the displayed collection window.</p>
          <p><strong className="text-text-primary">Unavailable</strong> means the source did not provide a permitted, reliable value. It is not zero.</p>
          <p><strong className="text-text-primary">Not a verdict</strong> means a score difference or unusual change cannot establish intent, identity, or manipulation by itself.</p>
        </div>
      </section>
    </div>
  );
}
