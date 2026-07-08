"use client";

import React, { useMemo } from 'react';

interface PopularityMetricsProps {
  animeA_title: string;
  animeB_title: string;
  animeA_al_pop: number;
  animeA_mal_pop: number;
  animeB_al_pop: number;
  animeB_mal_pop: number;
}

export default function PopularityMetrics({
  animeA_title,
  animeB_title,
  animeA_al_pop,
  animeA_mal_pop,
  animeB_al_pop,
  animeB_mal_pop
}: PopularityMetricsProps) {
  
  // Format numbers to clean readable string (e.g. 1.59M or 437K)
  const formatCompact = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short'
    }).format(num);
  };

  const stats = useMemo(() => {
    const malTotal = (animeA_mal_pop || 1) + (animeB_mal_pop || 1);
    const alTotal = (animeA_al_pop || 1) + (animeB_al_pop || 1);

    return {
      mal: {
        pctA: Math.round(((animeA_mal_pop || 0) / malTotal) * 100),
        pctB: Math.round(((animeB_mal_pop || 0) / malTotal) * 100)
      },
      anilist: {
        pctA: Math.round(((animeA_al_pop || 0) / alTotal) * 100),
        pctB: Math.round(((animeB_al_pop || 0) / alTotal) * 100)
      }
    };
  }, [animeA_al_pop, animeA_mal_pop, animeB_al_pop, animeB_mal_pop]);

  return (
    <div className="border border-border rounded-2xl bg-surface p-6 space-y-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.01),transparent_50%)]" />
      
      <div>
        <h4 className="text-sm font-black uppercase tracking-wider text-text-primary">Fandom Scale & Database Volume</h4>
        <p className="text-xs text-text-secondary mt-1">
          Comparing the total active database members. Database size determines the velocity of review campaigns.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
        {/* MyAnimeList Community Volume */}
        <div className="space-y-4">
          <div className="flex justify-between text-xs font-mono font-bold text-text-secondary">
            <span>MyAnimeList Database Volume</span>
            <span>Total: {formatCompact((animeA_mal_pop || 0) + (animeB_mal_pop || 0))} members</span>
          </div>

          <div className="space-y-2">
            <div className="h-4 w-full bg-background rounded-full overflow-hidden flex border border-border">
              <div className="bg-accent-mushoku transition-all duration-500" style={{ width: `${stats.mal.pctA}%` }} />
              <div className="bg-accent-rezero transition-all duration-500" style={{ width: `${stats.mal.pctB}%` }} />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-text-secondary">
              <span className="text-accent-mushoku">● {animeA_title}: {formatCompact(animeA_mal_pop)} ({stats.mal.pctA}%)</span>
              <span className="text-accent-rezero">{stats.mal.pctB}%: {formatCompact(animeB_mal_pop)} ●</span>
            </div>
          </div>
        </div>

        {/* AniList Community Volume */}
        <div className="space-y-4">
          <div className="flex justify-between text-xs font-mono font-bold text-text-secondary">
            <span>AniList Database Volume</span>
            <span>Total: {formatCompact((animeA_al_pop || 0) + (animeB_al_pop || 0))} followers</span>
          </div>

          <div className="space-y-2">
            <div className="h-4 w-full bg-background rounded-full overflow-hidden flex border border-border">
              <div className="bg-accent-mushoku transition-all duration-500" style={{ width: `${stats.anilist.pctA}%` }} />
              <div className="bg-accent-rezero transition-all duration-500" style={{ width: `${stats.anilist.pctB}%` }} />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-text-secondary">
              <span className="text-accent-mushoku">● {animeA_title}: {formatCompact(animeA_al_pop)} ({stats.anilist.pctA}%)</span>
              <span className="text-accent-rezero">{stats.anilist.pctB}%: {formatCompact(animeB_al_pop)} ●</span>
            </div>
          </div>
        </div>
      </div>

      <div className="text-[10px] text-text-secondary font-mono border-t border-border/40 pt-3 leading-relaxed">
        <strong>💡 Insight:</strong> A larger database volume makes a series less vulnerable to isolated review bombs, as a higher volume of organic user scores absorbs malicious ratings more easily.
      </div>
    </div>
  );
}
