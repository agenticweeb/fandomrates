import React from 'react';
import { supabase } from '@/lib/supabase';
import { Battle, ScoreSnapshot, AnomalyEvent, Season, Episode, Review } from '@/types';
import ScoreChart from '@/components/ScoreChart';
import EpisodeGrid from '@/components/EpisodeGrid';
import RatingDistributionChart from '@/components/RatingDistributionChart';
import PopularityMetrics from '@/components/PopularityMetrics';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface BattlePageProps {
  params: {
    slug: string;
  };
}

async function getBattleData(slug: string) {
  const battleResult = await supabase
    .from('battles')
    .select(`
      id, slug, is_active, anime_a_id, anime_b_id,
      anime_a:anime_a_id(*),
      anime_b:anime_b_id(*)
    `)
    .eq('slug', slug)
    .single();
  if (battleResult.error && battleResult.error.code !== 'PGRST116') throw new Error(`Battle data unavailable: ${battleResult.error.message}`);
  const battle = battleResult.data as Battle | null;

  if (!battle || !battle.anime_a || !battle.anime_b) {
    return { battle: null, chartData: [], anomalies: [], seasonsA: [], seasonsB: [], epsDataA: [], epsDataB: [], reviewsList: [] };
  }

  const idA = battle.anime_a_id;
  const idB = battle.anime_b_id;

  const seasonsResult = await supabase
    .from('seasons')
    .select('*')
    .in('anime_id', [idA, idB])
    .order('season_number', { ascending: true });
  if (seasonsResult.error) throw new Error(`Season evidence unavailable: ${seasonsResult.error.message}`);
  const seasons = seasonsResult.data as Season[] | null;

  const seasonsA = seasons?.filter(s => s.anime_id === idA) || [];
  const seasonsB = seasons?.filter(s => s.anime_id === idB) || [];

  const episodesResult = await supabase
    .from('episodes')
    .select('*')
    .in('anime_id', [idA, idB]);
  if (episodesResult.error) throw new Error(`Episode evidence unavailable: ${episodesResult.error.message}`);
  const episodes = episodesResult.data as Episode[] | null;

  const epsDataA = episodes?.filter(e => e.anime_id === idA) || [];
  const epsDataB = episodes?.filter(e => e.anime_id === idB) || [];

  const reviewsResult = await supabase
    .from('reviews')
    .select('*')
    .in('anime_id', [idA, idB])
    .order('review_date', { ascending: false });
  if (reviewsResult.error) throw new Error(`Review evidence unavailable: ${reviewsResult.error.message}`);
  const reviews = reviewsResult.data as Review[] | null;

  const reviewsList = reviews || [];

  const snapshotsResult = await supabase
    .from('score_snapshots')
    .select('*')
    .in('anime_id', [idA, idB])
    .order('scraped_at', { ascending: true });
  if (snapshotsResult.error) throw new Error(`Score evidence unavailable: ${snapshotsResult.error.message}`);
  const snapshots = snapshotsResult.data as ScoreSnapshot[] | null;

  const snapData = snapshots || [];

  const anomaliesResult = await supabase
    .from('anomaly_events')
    .select('*')
    .in('anime_id', [idA, idB])
    .order('detected_at', { ascending: false });
  if (anomaliesResult.error) throw new Error(`Anomaly evidence unavailable: ${anomaliesResult.error.message}`);
  const anomalies = anomaliesResult.data as AnomalyEvent[] | null;

  const chartDataMap: { [date: string]: any } = {};
  snapData.forEach((snap) => {
    const dateStr = new Date(snap.scraped_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    if (!chartDataMap[dateStr]) {
      chartDataMap[dateStr] = { date: dateStr };
    }
    const prefix = snap.anime_id === idA ? 'a' : 'b';
    chartDataMap[dateStr][`${prefix}_${snap.platform}`] = Number(snap.score);
  });
  const chartData = Object.values(chartDataMap);

  return { 
    battle, 
    chartData, 
    anomalies: anomalies || [],
    seasonsA,
    seasonsB,
    epsDataA,
    epsDataB,
    reviewsList,
    snapData
  };
}

export default async function BattlePage({ params }: BattlePageProps) {
  const { slug } = params;
  const { 
    battle, 
    chartData, 
    anomalies,
    seasonsA,
    seasonsB,
    epsDataA,
    epsDataB,
    reviewsList,
    snapData
  } = await getBattleData(slug);

  if (!battle) {
    return (
      <div className="py-24 text-center space-y-4">
        <h1 className="text-2xl font-bold text-text-primary">Comparison Block Not Found</h1>
        <p className="text-text-secondary">The specified tracking scope is unavailable.</p>
        <Link href="/" className="text-accent-cyan hover:underline inline-block mt-4">Return Home</Link>
      </div>
    );
  }

  const animeA = battle.anime_a!;
  const animeB = battle.anime_b!;

  const statsA_AL_pop = snapData.find(s => s.anime_id === animeA.id && s.platform === 'anilist')?.popularity ?? null;
  const statsA_MAL_pop = snapData.find(s => s.anime_id === animeA.id && s.platform === 'mal')?.popularity ?? null;
  
  const statsB_AL_pop = snapData.find(s => s.anime_id === animeB.id && s.platform === 'anilist')?.popularity ?? null;
  const statsB_MAL_pop = snapData.find(s => s.anime_id === animeB.id && s.platform === 'mal')?.popularity ?? null;

  // Calculate dynamic 7-Day Activity stats
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentReviews = reviewsList.filter(r => r.review_date ? new Date(r.review_date) >= sevenDaysAgo : false);
  const recentA = recentReviews.filter(r => r.anime_id === animeA.id);
  const recentB = recentReviews.filter(r => r.anime_id === animeB.id);

  const recentCountA = recentA.length;
  const recentCountB = recentB.length;

  return (
    <div className="space-y-16">
      
      {/* Side-by-Side Split Headers */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-surface flex flex-col md:flex-row min-h-[380px]">
        <div className="flex-1 p-8 md:p-12 flex flex-col justify-between relative overflow-hidden min-h-[250px] border-b md:border-b-0 md:border-r border-border">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{ backgroundImage: "url('/images/mushoku-banner.jpg')" }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent"></div>
          
          <div className="z-10 space-y-4">
            <span className="inline-flex px-3 py-1 rounded text-xs font-black uppercase tracking-widest bg-surface-elevated border border-border">
              Tracked campaign A
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-text-primary drop-shadow-md">{animeA.title_english}</h1>
            <p className="text-xs font-mono text-text-secondary">{animeA.title_romaji}</p>
            <p className="text-sm text-text-secondary max-w-md line-clamp-3 leading-relaxed">{animeA.synopsis}</p>
          </div>
        </div>

        <div className="flex-1 p-8 md:p-12 flex flex-col justify-between items-start md:items-end text-left md:text-right relative overflow-hidden min-h-[250px]">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{ backgroundImage: "url('/images/rezero-banner.jpg')" }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-l from-background via-background/80 to-transparent"></div>

          <div className="z-10 space-y-4">
            <span className="inline-flex px-3 py-1 rounded text-xs font-black uppercase tracking-widest bg-surface-elevated border border-border">
              Tracked campaign B
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-text-primary drop-shadow-md">{animeB.title_english}</h2>
            <p className="text-xs font-mono text-text-secondary">{animeB.title_romaji}</p>
            <p className="text-sm text-text-secondary max-w-md line-clamp-3 md:ml-auto leading-relaxed">{animeB.synopsis}</p>
          </div>
        </div>
      </section>

      {/* Switchable Rating Distribution U-Curves */}
      <section className="space-y-6">
        <div>
          <h3 className="text-2xl font-black uppercase tracking-wider text-text-primary">Analytical Score Distribution</h3>
          <p className="text-sm text-text-secondary mt-1">Shows the observed review-score distribution when the named source provides enough permitted review data. Extremes are context, not proof of intent.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RatingDistributionChart 
            title={`${animeA.title_english} Distribution`} 
            accentColor="#7c3aed" 
            seasons={seasonsA}
            episodes={epsDataA}
            reviews={reviewsList.filter(r => r.anime_id === animeA.id)}
          />
          <RatingDistributionChart 
            title={`${animeB.title_english} Distribution`} 
            accentColor="#dc2626" 
            seasons={seasonsB}
            episodes={epsDataB}
            reviews={reviewsList.filter(r => r.anime_id === animeB.id)}
          />
        </div>
      </section>

      {/* Historical Scoring Charts */}
      <section className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-text-primary">Platform Scoring History</h3>
          <p className="text-sm text-text-secondary mt-1">Comparing tracking fluctuations and divergence indices over time.</p>
        </div>
        <ScoreChart
          data={chartData}
          seriesKeys={['a_anilist', 'b_anilist', 'a_mal', 'b_mal', 'a_kitsu', 'b_kitsu']}
          seriesLabels={{
            a_anilist: `${animeA.title_english} (AL)`,
            b_anilist: `${animeB.title_english} (AL)`,
            a_mal: `${animeA.title_english} (MAL)`,
            b_mal: `${animeB.title_english} (MAL)`,
            a_kitsu: `${animeA.title_english} (Kitsu)`,
            b_kitsu: `${animeB.title_english} (Kitsu)`
          }}
          colors={{
            a_anilist: '#7c3aed',
            b_anilist: '#06b6d4',
            a_mal: '#c084fc',
            b_mal: '#3b82f6',
            a_kitsu: '#f43f5e',
            b_kitsu: '#f97316'
          }}
        />
      </section>

      {/* Database Volume & Popularity Section */}
      <section className="space-y-6">
        <div>
          <h3 className="text-2xl font-black uppercase tracking-wider text-text-primary">Database Volume & Engagement Index</h3>
          <p className="text-sm text-text-secondary mt-1">Analysing active platform user tracking counts [14].</p>
        </div>
        <PopularityMetrics
          animeA_title={animeA.title_english || 'Tracker A'}
          animeB_title={animeB.title_english || 'Tracker B'}
          animeA_al_pop={statsA_AL_pop}
          animeA_mal_pop={statsA_MAL_pop}
          animeB_al_pop={statsB_AL_pop}
          animeB_mal_pop={statsB_MAL_pop}
        />
      </section>

      {/* Dynamic 7-Day accepted review activity */}
      <section className="space-y-6">
        <div>
          <h3 className="text-2xl font-black uppercase tracking-wider text-text-primary">Recent accepted review activity</h3>
          <p className="text-sm text-text-secondary mt-1">A source-backed count of reviews dated in the last seven days. It does not identify intent or represent all ratings.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-mono text-xs text-text-secondary">
          <div className="border border-border rounded-xl bg-surface p-5 space-y-4">
            <h4 className="font-extrabold text-sm text-text-primary">{animeA.title_english}</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-danger/10 border border-danger/25 rounded-lg text-danger">
                <div>Reviews in window</div>
                <div className="text-lg font-black mt-1">{recentCountA}</div>
              </div>
              <div className="p-3 bg-success/10 border border-success/25 rounded-lg text-success col-span-2">
                <div>Source-backed only</div>
                <div className="text-lg font-black mt-1">Yes</div>
              </div>
            </div>
          </div>
          <div className="border border-border rounded-xl bg-surface p-5 space-y-4">
            <h4 className="font-extrabold text-sm text-text-primary">{animeB.title_english}</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-danger/10 border border-danger/25 rounded-lg text-danger">
                <div>Reviews in window</div>
                <div className="text-lg font-black mt-1">{recentCountB}</div>
              </div>
              <div className="p-3 bg-success/10 border border-success/25 rounded-lg text-success col-span-2">
                <div>Source-backed only</div>
                <div className="text-lg font-black mt-1">Yes</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Milestone Timelines */}
      <section className="space-y-12">
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-wider text-text-primary">{animeA.title_english} Episode Milestones</h3>
            <p className="text-sm text-text-secondary mt-1">Select season poster card to inspect schedule metrics.</p>
          </div>
          <EpisodeGrid
            episodes={epsDataA}
            reviews={reviewsList.filter(r => r.anime_id === animeA.id)}
            snapshots={snapData.filter(s => s.anime_id === animeA.id)}
            anomalies={anomalies.filter(an => an.anime_id === animeA.id)}
            seasons={seasonsA}
          />
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-wider text-text-primary">{animeB.title_english} Episode Milestones</h3>
            <p className="text-sm text-text-secondary mt-1">Select season poster card to inspect schedule metrics.</p>
          </div>
          <EpisodeGrid
            episodes={epsDataB}
            reviews={reviewsList.filter(r => r.anime_id === animeB.id)}
            snapshots={snapData.filter(s => s.anime_id === animeB.id)}
            anomalies={anomalies.filter(an => an.anime_id === animeB.id)}
            seasons={seasonsB}
          />
        </div>
      </section>

    </div>
  );
}
