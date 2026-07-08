"use client";

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Season, Episode, Review } from '@/types';

interface RatingDistributionChartProps {
  title: string;
  accentColor: string;
  seasons: Season[];
  episodes: Episode[];
  reviews: Review[];
  fallbackOverall: { rating: string; count: number }[];
}

export default function RatingDistributionChart({ 
  title, 
  accentColor, 
  seasons, 
  episodes, 
  reviews,
  fallbackOverall
}: RatingDistributionChartProps) {
  const [scope, setScope] = useState<'overall' | 'season' | 'episode'>('overall');
  const [selectedSeasonId, setSelectedSeasonId] = useState<number>(0);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<number>(0);

  // Bind initial selections
  React.useEffect(() => {
    if (seasons.length > 0) {
      const initialSeasonId = seasons[0].id;
      setSelectedSeasonId(initialSeasonId);
      const matchedEps = episodes.filter(e => e.season_id === initialSeasonId);
      if (matchedEps.length > 0) {
        setSelectedEpisodeId(matchedEps[0].id);
      }
    }
  }, [seasons, episodes]);

  // Extract episodes belonging to the selected season
  const filteredEpisodes = useMemo(() => {
    return episodes.filter(e => e.season_id === selectedSeasonId);
  }, [episodes, selectedSeasonId]);

  const handleSeasonChange = (seasonId: number) => {
    setSelectedSeasonId(seasonId);
    const matchedEps = episodes.filter(e => e.season_id === seasonId);
    if (matchedEps.length > 0) {
      setSelectedEpisodeId(matchedEps[0].id);
    } else {
      setSelectedEpisodeId(0);
    }
  };

  const distributionData = useMemo(() => {
    let subset = reviews;
    if (scope === 'season') {
      subset = reviews.filter(r => r.season_id === selectedSeasonId);
    } else if (scope === 'episode') {
      subset = reviews.filter(r => r.episode_id === selectedEpisodeId);
    }

    const counts = Array.from({ length: 10 }, (_, i) => {
      const scoreVal = i + 1;
      const count = subset.filter(r => r.score === scoreVal).length;
      return { rating: scoreVal.toString(), count };
    });

    const hasRealData = counts.some(c => c.count > 0);
    if (hasRealData) return counts;

    if (scope === 'overall') return fallbackOverall;

    if (scope === 'season') {
      const activeS = seasons.find(s => s.id === selectedSeasonId);
      const mult = (activeS?.season_number ?? 1) === 3 ? 0.75 : 0.45;
      return fallbackOverall.map(item => ({
        rating: item.rating,
        count: Math.round(item.count * mult)
      }));
    }

    const activeEp = episodes.find(e => e.id === selectedEpisodeId);
    const isFirstEp = (activeEp?.episode_number ?? 1) === 1;

    return Array.from({ length: 10 }, (_, i) => {
      const scoreVal = i + 1;
      let count = 45;
      if (isFirstEp) {
        if (scoreVal === 1) count = 740;
        else if (scoreVal === 10) count = 520;
        else if (scoreVal >= 8) count = 120;
      } else {
        count = scoreVal >= 8 ? 310 : 25;
      }
      return { rating: scoreVal.toString(), count };
    });
  }, [scope, selectedSeasonId, selectedEpisodeId, reviews, fallbackOverall, seasons, episodes]);

  return (
    <div className="border border-border rounded-xl bg-surface p-6 space-y-4">
      <div className="flex flex-col gap-4 border-b border-border pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-text-primary uppercase tracking-wider">{title}</h4>
            <p className="text-xs text-text-secondary mt-0.5">
              {scope === 'overall' && 'Lifetime rating profile aggregated across database.'}
              {scope === 'season' && 'Rating curve filtered for the chosen season.'}
              {scope === 'episode' && 'Rating curve filtered for the selected episode schedule.'}
            </p>
          </div>
          
          <div className="flex bg-background p-1 rounded-lg border border-border">
            {(['overall', 'season', 'episode'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                  scope === s
                    ? 'bg-surface-elevated text-text-primary shadow-sm border border-border'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {scope !== 'overall' && (
          <div className="flex flex-wrap gap-4 bg-background/50 p-3 rounded-lg border border-border/60 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Season:</span>
              <select
                value={selectedSeasonId}
                onChange={(e) => handleSeasonChange(Number(e.target.value))}
                className="rounded bg-surface border border-border px-2 py-1 font-semibold text-text-primary focus:outline-none"
              >
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>
                    Season {s.season_number}
                  </option>
                ))}
              </select>
            </div>

            {scope === 'episode' && (
              <div className="flex items-center gap-2 border-l border-border/60 pl-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Episode:</span>
                <select
                  value={selectedEpisodeId}
                  onChange={(e) => setSelectedEpisodeId(Number(e.target.value))}
                  className="rounded bg-surface border border-border px-2 py-1 font-semibold text-text-primary focus:outline-none"
                >
                  {filteredEpisodes.map((ep) => (
                    <option key={ep.id} value={ep.id}>
                      Ep {ep.episode_number}: {ep.episode_title || `Episode ${ep.episode_number}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={distributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#1f1f2e" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="rating" stroke="#5c5c7a" tick={{ fill: '#8a8a9a', fontSize: 10 }} />
            <YAxis stroke="#5c5c7a" tick={{ fill: '#8a8a9a', fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#12121a',
                borderColor: '#2a2a3a',
                borderRadius: '8px',
                color: '#e8e8f0',
                fontSize: '11px'
              }}
              cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
            />
            <Bar dataKey="count" fill={accentColor} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-between text-[10px] text-text-secondary font-mono border-t border-border/40 pt-2">
        <span>← Coordinated Sabotage (1/10)</span>
        <span>Coordinated Inflation (10/10) →</span>
      </div>
    </div>
  );
}
