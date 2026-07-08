import React from 'react';
import { Episode } from '@/types';

interface EpisodeCardProps {
  episode: Episode;
  overallScore: number | null;
  anomalyDetected: boolean;
  reviewCount: number;
  onClick: () => void;
}

export default function EpisodeCard({ 
  episode, 
  overallScore, 
  anomalyDetected, 
  reviewCount, 
  onClick 
}: EpisodeCardProps) {
  const airDate = episode.aired_date 
    ? new Date(episode.aired_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'N/A';

  return (
    <div 
      onClick={onClick}
      className="border border-border rounded-xl bg-surface hover:bg-surface-elevated hover:border-text-secondary/30 transition-all cursor-pointer overflow-hidden flex flex-col h-64 relative group shadow-md"
    >
      {anomalyDetected && (
        <span className="absolute top-3 right-3 bg-danger/20 text-danger text-[9px] font-extrabold uppercase px-2 py-0.5 border border-danger/30 rounded-full z-10 backdrop-blur-sm animate-pulse">
          Anomaly Week
        </span>
      )}

      {/* Dynamic Streaming Thumbnail Container */}
      <div className="relative aspect-video w-full bg-background overflow-hidden border-b border-border/80">
        {episode.thumbnail_url ? (
          <img
            src={episode.thumbnail_url}
            alt={episode.episode_title || `Episode ${episode.episode_number}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface to-background text-[10px] text-text-secondary font-mono">
            Thumbnail N/A
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60"></div>
      </div>
      
      {/* Content Container */}
      <div className="p-4 flex-grow flex flex-col justify-between">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-accent-gold uppercase tracking-wider">
              Episode {episode.episode_number}
            </span>
            {overallScore && (
              <span className="text-[10px] font-bold text-accent-cyan bg-accent-cyan/10 px-1.5 py-0.5 rounded border border-accent-cyan/20">
                ★ {overallScore.toFixed(2)}
              </span>
            )}
          </div>
          
          <h4 className="text-sm font-bold text-text-primary line-clamp-2 leading-snug group-hover:text-accent-cyan transition-colors">
            {episode.episode_title || `Episode ${episode.episode_number}`}
          </h4>
        </div>

        <div className="border-t border-border/40 pt-2 flex items-center justify-between text-[10px] text-text-secondary font-mono">
          <span>Aired: {airDate}</span>
          <span>{reviewCount} reviews</span>
        </div>
      </div>
    </div>
  );
}
