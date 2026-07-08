"use client";

import React, { useState } from 'react';
import { EpisodeScore } from '@/types';

interface EpisodeTimelineProps {
  episodes: EpisodeScore[];
}

export default function EpisodeTimeline({ episodes }: EpisodeTimelineProps) {
  const [selectedSeason, setSelectedSeason] = useState<number>(1);

  if (!episodes || episodes.length === 0) {
    return (
      <div className="p-6 border border-border rounded-xl bg-surface text-center">
        <p className="text-sm text-text-secondary">No episode listings have been populated for this anime.</p>
      </div>
    );
  }

  // Extract unique season numbers present
  const availableSeasons = Array.from(
    new Set(episodes.map((ep) => ep.season_number ?? 1))
  ).sort((a, b) => a - b);

  // Filter and sort the episodes belonging to the active season selection
  const filteredEpisodes = episodes
    .filter((ep) => (ep.season_number ?? 1) === selectedSeason)
    .sort((a, b) => (a.episode_number ?? 0) - (b.episode_number ?? 0));

  return (
    <div className="space-y-4">
      {/* Premium Season Selector Tab Menu */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex gap-2">
          {availableSeasons.map((seasonNum) => (
            <button
              key={seasonNum}
              onClick={() => setSelectedSeason(seasonNum)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
                selectedSeason === seasonNum
                  ? 'bg-text-primary text-background border-text-primary shadow'
                  : 'bg-background text-text-secondary border-border hover:border-text-secondary/30'
              }`}
            >
              Season {seasonNum}
            </button>
          ))}
        </div>
        <span className="text-xs text-text-secondary font-mono">
          Showing {filteredEpisodes.length} parsed milestones
        </span>
      </div>

      {/* Season Horizontal Timeline Flow */}
      <div className="w-full overflow-x-auto pb-4 scrollbar">
        <div className="flex gap-4 min-w-max px-2">
          {filteredEpisodes.map((ep) => {
            const airDateFormatted = ep.air_date 
              ? new Date(ep.air_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'Unknown';

            return (
              <div 
                key={ep.id} 
                className="w-64 p-5 border border-border rounded-xl bg-surface hover:border-text-secondary/30 transition-all flex flex-col justify-between gap-3 relative overflow-hidden"
              >
                {selectedSeason === 3 && ep.episode_number === 1 && ep.anime_id === 1 && (
                  <div className="absolute top-0 right-0 bg-danger/20 text-danger text-[9px] font-extrabold uppercase px-2 py-0.5 border-b border-l border-danger/30 rounded-bl">
                    Bombed Target
                  </div>
                )}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-accent-gold uppercase tracking-wider">
                      EPISODE {ep.episode_number ?? 'N/A'}
                    </span>
                    {ep.score && (
                      <span className="text-xs font-semibold text-accent-cyan bg-accent-cyan/10 px-1.5 py-0.5 rounded">
                        ★ {ep.score.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-text-primary mt-2 line-clamp-2">
                    {ep.episode_title || `Episode ${ep.episode_number ?? 'N/A'}`}
                  </h4>
                </div>
                <div className="text-[11px] text-text-secondary border-t border-border/50 pt-2 flex justify-between">
                  <span>Aired: {airDateFormatted}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
