import React from 'react';
import { EpisodeScore } from '@/types';

interface EpisodeTimelineProps {
  episodes: EpisodeScore[];
}

export default function EpisodeTimeline({ episodes }: EpisodeTimelineProps) {
  if (!episodes || episodes.length === 0) {
    return (
      <div className="p-6 border border-border rounded-xl bg-surface text-center">
        <p className="text-sm text-text-secondary">No episode listings have been populated for this anime.</p>
      </div>
    );
  }

  // Sort episodes chronologically using null fallbacks to ensure type-safety
  const sortedEpisodes = [...episodes].sort(
    (a, b) => (a.episode_number ?? 0) - (b.episode_number ?? 0)
  );

  return (
    <div className="w-full overflow-x-auto pb-4 scrollbar">
      <div className="flex gap-4 min-w-max px-2">
        {sortedEpisodes.map((ep) => {
          const airDateFormatted = ep.air_date 
            ? new Date(ep.air_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : 'Unknown';

          return (
            <div 
              key={ep.id} 
              className="w-56 p-4 border border-border rounded-xl bg-surface hover:border-text-secondary/30 transition-all flex flex-col justify-between gap-3"
            >
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
                <h4 className="text-sm font-semibold text-text-primary mt-1 line-clamp-2">
                  {ep.episode_title || `Episode ${ep.episode_number ?? 'N/A'}`}
                </h4>
              </div>
              <div className="text-[11px] text-text-secondary border-t border-border/50 pt-2">
                Aired: {airDateFormatted}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
