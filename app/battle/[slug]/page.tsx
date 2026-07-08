import React from 'react';
import { supabase } from '@/lib/supabase';
import { Battle, ScoreSnapshot, SuspiciousProfile, AnomalyEvent, Season, Episode, Review } from '@/types';
import ScoreChart from '@/components/ScoreChart';
import EpisodeGrid from '@/components/EpisodeGrid';
import ProfileEvidence from '@/components/ProfileEvidence';
import RatingDistributionChart from '@/components/RatingDistributionChart';
import PlatformBattlegrounds from '@/components/PlatformBattlegrounds';
import PopularityMetrics from '@/components/PopularityMetrics';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface BattlePageProps {
  params: {
    slug: string;
  };
}

async function getBattleData(slug: string) {
  const { data: battle } = await supabase
    .from('battles')
    .select(`
      id, slug, is_active, anime_a_id, anime_b_id,
      anime_a:anime_a_id(*),
      anime_b:anime_b_id(*)
    `)
    .eq('slug', slug)
    .single() as { data: Battle | null };

  if (!battle || !battle.anime_a || !battle.anime_b) {
    return { battle: null, chartData: [], suspicious: [], anomalies: [], seasonsA: [], seasonsB: [], epsDataA: [], epsDataB: [], reviewsList: [] };
  }

  const idA = battle.anime_a_id;
  const idB = battle.anime_b_id;

  const { data: seasons } = await supabase
    .from('seasons')
    .select('*')
    .in('anime_id', [idA, idB])
    .order('season_number', { ascending: true }) as { data: Season[] | null };

  const seasonsA = seasons?.filter(s => s.anime_id === idA) || [];
  const seasonsB = seasons?.filter(s => s.anime_id === idB) || [];

  const { data: episodes } = await supabase
    .from('episodes')
    .select('*')
    .in('anime_id', [idA, idB]) as { data: Episode[] | null };

  const epsDataA = episodes?.filter(e => e.anime_id === idA) || [];
  const epsDataB = episodes?.filter(e => e.anime_id === idB) || [];

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .in('anime_id', [idA, idB])
    .order('review_date', { ascending: false }) as { data: Review[] | null };

  const reviewsList = reviews || [];

  const { data: snapshots } = await supabase
    .from('score_snapshots')
    .select('*')
    .in('anime_id', [idA, idB])
    .order('scraped_at', { ascending: true }) as { data: ScoreSnapshot[] | null };

  const snapData = snapshots || [];

  const { data: suspicious } = await supabase
    .from('suspicious_profiles')
    .select('*')
    .in('anime_id', [idA, idB])
    .order('found_at', { ascending: false }) as { data: SuspiciousProfile[] | null };

  const { data: anomalies } = await supabase
    .from('anomaly_events')
    .select('*')
    .in('anime_id', [idA, idB])
    .order('detected_at', { ascending: false }) as { data: AnomalyEvent[] | null };

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
    suspicious: suspicious || [], 
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
    suspicious, 
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

  const activeBannerA = '/images/mushoku-banner.jpg';
  const activeBannerB = '/images/rezero-banner.jpg';

  const animeMap = {
    [animeA.id]: {
      title: animeA.title_english || 'Tracker A',
      colorClass: 'text-text-primary bg-surface-elevated',
      borderClass: 'border-border'
    },
    [animeB.id]: {
      title: animeB.title_english || 'Tracker B',
      colorClass: 'text-text-primary bg-surface-elevated',
      borderClass: 'border-border'
    }
  };

  const mushokuFallbackCurve = [
    { rating: '1', count: 1450 }, { rating: '2', count: 210 }, { rating: '3', count: 110 }, { rating: '4', count: 80 }, { rating: '5', count: 120 }, { rating: '6', count: 320 }, { rating: '7', count: 850 }, { rating: '8', count: 1950 }, { rating: '9', count: 3800 }, { rating: '10', count: 4900 }
  ];

  const rezeroFallbackCurve = [
    { rating: '1', count: 980 }, { rating: '2', count: 145 }, { rating: '3', count: 80 }, { rating: '4', count: 65 }, { rating: '5', count: 110 }, { rating: '6', count: 280 }, { rating: '7', count: 810 }, { rating: '8', count: 1840 }, { rating: '9', count: 3650 }, { rating: '10', count: 5800 }
  ];

  // Resolve dynamic live database popularity/fan metrics [4.1]
  const statsA_AL_pop = snapData.find(s => s.anime_id === animeA.id && s.platform === 'anilist')?.popularity || 437420;
  const statsA_MAL_pop = snapData.find(s => s.anime_id === animeA.id && s.platform === 'mal')?.popularity || 1595540;
  
  const statsB_AL_pop = snapData.find(s => s.anime_id === animeB.id && s.platform === 'anilist')?.popularity || 601809;
  const statsB_MAL_pop = snapData.find(s => s.anime_id === animeB.id && s.platform === 'mal')?.popularity || 2484599;

  return (
    <div className="space-y-16">
      
      {/* Side-by-Side Neutral Split Headers */}
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
          <p className="text-sm text-text-secondary mt-1">Exposes the exact distribution of 1s (coordinated low-rating signatures) and 10s (coordinated high-rating signatures).</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RatingDistributionChart 
            title={`${animeA.title_english} Distribution`} 
            accentColor="#7c3aed" 
            seasons={seasonsA}
            episodes={epsDataA}
            reviews={reviewsList.filter(r => r.anime_id === animeA.id)}
            fallbackOverall={mushokuFallbackCurve}
          />
          <RatingDistributionChart 
            title={`${animeB.title_english} Distribution`} 
            accentColor="#dc2626" 
            seasons={seasonsB}
            episodes={epsDataB}
            reviews={reviewsList.filter(r => r.anime_id === animeB.id)}
            fallbackOverall={rezeroFallbackCurve}
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
          seriesKeys={['a_anilist', 'b_anilist', 'a_mal', 'b_mal']}
          seriesLabels={{
            a_anilist: `${animeA.title_english} (AL)`,
            b_anilist: `${animeB.title_english} (AL)`,
            a_mal: `${animeA.title_english} (MAL)`,
            b_mal: `${animeB.title_english} (MAL)`
          }}
          colors={{
            a_anilist: '#7c3aed',
            b_anilist: '#06b6d4',
            a_mal: '#c084fc',
            b_mal: '#3b82f6'
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

      {/* Platform Factions comparisons */}
      <section className="space-y-6">
        <div>
          <h3 className="text-2xl font-black uppercase tracking-wider text-text-primary">Platform Battlegrounds Audit</h3>
          <p className="text-sm text-text-secondary mt-1">
            Analyzing whether MyAnimeList (MAL) or AniList is home to the most intense coordinated high-rating (10/10) or coordinated low-rating (1-2/10) signatures.
          </p>
        </div>
        <PlatformBattlegrounds 
          profiles={suspicious} 
          animeA_id={animeA.id} 
          animeB_id={animeB.id} 
          animeA_title={animeA.title_english || 'Tracker A'} 
          animeB_title={animeB.title_english || 'Tracker B'} 
        />
      </section>

      {/* Audit table logs */}
      <section className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-text-primary">Coordinated Activity Audit Logs</h3>
          <p className="text-sm text-text-secondary mt-1">
            Anonymized user logs displaying target shows and behavioral patterns [1].
          </p>
        </div>
        <ProfileEvidence profiles={suspicious} animeMap={animeMap} />
      </section>
    </div>
  );
}
