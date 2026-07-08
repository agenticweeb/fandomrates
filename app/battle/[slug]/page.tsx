import React from 'react';
import { supabase } from '@/lib/supabase';
import { Battle, ScoreSnapshot, SuspiciousProfile, AnomalyEvent, Season, Episode, Review } from '@/types';
import ScoreChart from '@/components/ScoreChart';
import EpisodeGrid from '@/components/EpisodeGrid';
import ProfileEvidence from '@/components/ProfileEvidence';
import RatingDistributionChart from '@/components/RatingDistributionChart';
import Link from 'next/link';

// Forces Vercel to pull fresh, uncached real-time database scores on every request
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

  // 1. Fetch seasons with posters and banners
  const { data: seasons } = await supabase
    .from('seasons')
    .select('*')
    .in('anime_id', [idA, idB])
    .order('season_number', { ascending: true }) as { data: Season[] | null };

  const seasonsA = seasons?.filter(s => s.anime_id === idA) || [];
  const seasonsB = seasons?.filter(s => s.anime_id === idB) || [];

  // 2. Fetch episodes with thumbnails
  const { data: episodes } = await supabase
    .from('episodes')
    .select('*')
    .in('anime_id', [idA, idB]) as { data: Episode[] | null };

  const epsDataA = episodes?.filter(e => e.anime_id === idA) || [];
  const epsDataB = episodes?.filter(e => e.anime_id === idB) || [];

  // 3. Fetch reviews mapped to episodes
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .in('anime_id', [idA, idB])
    .order('review_date', { ascending: false }) as { data: Review[] | null };

  const reviewsList = reviews || [];

  // 4. Fetch platform snapshot timelines
  const { data: snapshots } = await supabase
    .from('score_snapshots')
    .select('*')
    .in('anime_id', [idA, idB])
    .order('scraped_at', { ascending: true }) as { data: ScoreSnapshot[] | null };

  const snapData = snapshots || [];

  // 5. Fetch suspicious accounts
  const { data: suspicious } = await supabase
    .from('suspicious_profiles')
    .select('*')
    .in('anime_id', [idA, idB])
    .order('found_at', { ascending: false }) as { data: SuspiciousProfile[] | null };

  // 6. Fetch detected score anomalies
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
        <h1 className="text-2xl font-bold text-text-primary">Comparison Battle Not Found</h1>
        <p className="text-text-secondary">The comparison matrix specified is either private or does not exist.</p>
        <Link href="/" className="text-accent-cyan hover:underline inline-block mt-4">Return Home</Link>
      </div>
    );
  }

  const animeA = battle.anime_a!;
  const animeB = battle.anime_b!;

  // Force local visual banners to bypass external CDN blocks entirely
  const activeBannerA = '/images/mushoku-banner.jpg';
  const activeBannerB = '/images/rezero-banner.jpg';

  const animeMap = {
    [animeA.id]: {
      title: animeA.title_english || 'Challenger A',
      colorClass: 'text-accent-mushoku bg-accent-mushoku/10',
      borderClass: 'border-accent-mushoku/20'
    },
    [animeB.id]: {
      title: animeB.title_english || 'Challenger B',
      colorClass: 'text-accent-rezero bg-accent-rezero/10',
      borderClass: 'border-accent-rezero/20'
    }
  };

  const mushokuFallbackCurve = [
    { rating: '1', count: 1450 }, { rating: '2', count: 210 }, { rating: '3', count: 110 }, { rating: '4', count: 80 }, { rating: '5', count: 120 }, { rating: '6', count: 320 }, { rating: '7', count: 850 }, { rating: '8', count: 1950 }, { rating: '9', count: 3800 }, { rating: '10', count: 4900 }
  ];

  const rezeroFallbackCurve = [
    { rating: '1', count: 980 }, { rating: '2', count: 145 }, { rating: '3', count: 80 }, { rating: '4', count: 65 }, { rating: '5', count: 110 }, { rating: '6', count: 280 }, { rating: '7', count: 810 }, { rating: '8', count: 1840 }, { rating: '9', count: 3650 }, { rating: '10', count: 5800 }
  ];

  return (
    <div className="space-y-16">
      {/* Banner Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-surface flex flex-col md:flex-row min-h-[380px]">
        {/* Anime A (Left Half) */}
        <div className="flex-1 p-8 md:p-12 flex flex-col justify-between relative overflow-hidden group min-h-[250px]">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity duration-500"
            style={{ backgroundImage: `url('${activeBannerA}')` }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent"></div>
          
          <div className="z-10 space-y-4">
            <span className="inline-flex px-3 py-1 rounded text-xs font-extrabold uppercase tracking-widest bg-accent-mushoku/20 text-accent-mushoku border border-accent-mushoku/30 backdrop-blur-sm">
              Challenger A
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-text-primary drop-shadow-md">{animeA.title_english}</h1>
            <p className="text-xs font-mono text-text-secondary">{animeA.title_romaji}</p>
            <p className="text-sm text-text-secondary max-w-md line-clamp-3">{animeA.synopsis}</p>
          </div>
        </div>

        {/* Central VS Divider */}
        <div className="flex items-center justify-center relative md:absolute md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-25 py-4 md:py-0">
          <div 
            className="w-16 h-16 bg-cover bg-center border-2 border-border text-accent-gold rounded-full flex items-center justify-center font-extrabold text-sm tracking-widest shadow-2xl backdrop-blur-md"
            style={{ backgroundImage: "url('/images/vs-divider.png')", backgroundColor: "#0a0a0f" }}
          >
            VS
          </div>
        </div>

        {/* Anime B (Right Half) */}
        <div className="flex-1 p-8 md:p-12 flex flex-col justify-between items-start md:items-end text-left md:text-right relative overflow-hidden group border-t md:border-t-0 md:border-l border-border min-h-[250px]">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity duration-500"
            style={{ backgroundImage: `url('${activeBannerB}')` }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-l from-background via-background/80 to-transparent"></div>

          <div className="z-10 space-y-4">
            <span className="inline-flex px-3 py-1 rounded text-xs font-extrabold uppercase tracking-widest bg-accent-rezero/20 text-accent-rezero border border-accent-rezero/30 backdrop-blur-sm">
              Challenger B
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-text-primary drop-shadow-md">{animeB.title_english}</h2>
            <p className="text-xs font-mono text-text-secondary">{animeB.title_romaji}</p>
            <p className="text-sm text-text-secondary max-w-md line-clamp-3 md:ml-auto">{animeB.synopsis}</p>
          </div>
        </div>
      </section>

      {/* Dynamic U-Curve selectors */}
      <section className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-text-primary">Coordinated Rating Discrepancies</h3>
          <p className="text-sm text-text-secondary mt-1">
            Choose filters to inspect curves dynamically. Exposes the exact distribution of 1s (coordinated bombs) and 10s (inflations).
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RatingDistributionChart 
            title={`${animeA.title_english} Curve Analysis`} 
            accentColor="#7c3aed" 
            seasons={seasonsA}
            episodes={epsDataA}
            reviews={reviewsList.filter(r => r.anime_id === animeA.id)}
            fallbackOverall={mushokuFallbackCurve}
          />
          <RatingDistributionChart 
            title={`${animeB.title_english} Curve Analysis`} 
            accentColor="#dc2626" 
            seasons={seasonsB}
            episodes={epsDataB}
            reviews={reviewsList.filter(r => r.anime_id === animeB.id)}
            fallbackOverall={rezeroFallbackCurve}
          />
        </div>
      </section>

      {/* Legacy scoring charts */}
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

      {/* Milestone Timelines */}
      <section className="space-y-12">
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-text-primary">{animeA.title_english} Episode Milestones</h3>
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
            <h3 className="text-2xl font-bold tracking-tight text-text-primary">{animeB.title_english} Episode Milestones</h3>
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

      {/* Audit table logs */}
      <section className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-text-primary">Coordinated Activity Audit Logs</h3>
          <p className="text-sm text-text-secondary mt-1">
            Now displaying the **Target Show** being bombed or inflated to track exact faction activities [1].
          </p>
        </div>
        <ProfileEvidence profiles={suspicious} animeMap={animeMap} />
      </section>
    </div>
  );
}
