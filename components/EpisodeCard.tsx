"use client";

import React from 'react';
import { Episode } from '@/types';
import { motion } from 'framer-motion';

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

  const scoreString = episode.rating 
    ? `${Number(episode.rating).toFixed(2)}` 
    : 'N/A';

  return (
    <motion.div 
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`border rounded-xl bg-surface hover:bg-surface-elevated hover:border-text-secondary/30 transition-all cursor-pointer overflow-hidden flex flex-col h-72 relative group shadow-md ${
        anomalyDetected 
          ? 'border-danger/30 hover:shadow-[0_0_20px_rgba(239,68,68,0.1)]' 
          : 'border-border hover:shadow-[0_0_15px_rgba(255,255,255,0.02)]'
      }`}
    >
      {anomalyDetected && (
        <span className="absolute top-3 right-3 bg-danger/20 text-danger text-[9px] font-extrabold uppercase px-2 py-0.5 border border-danger/30 rounded-full z-10 backdrop-blur-sm animate-pulse">
          🔥 Hot Week — Score moved
        </span>
      )}

      {/* Streaming Thumbnail Container */}
      <div className="relative aspect-video w-full bg-background overflow-hidden border-b border-border/80">
        {episode.thumbnail_url ? (
          <img
            src={episode.thumbnail_url}
            alt={episode.episode_title || `Episode ${episode.episode_number}`}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = "/images/fallback-image.svg";
            }}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <img
            src="/images/fallback-image.svg"
            alt={episode.episode_title || `Episode ${episode.episode_number}`}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-70"></div>
      </div>
      
      {/* Narrative Card Details */}
      <div className="p-4 flex-grow flex flex-col justify-between">
        <div className="space-y-1">
          <span className="text-[10px] font-black text-accent-gold uppercase tracking-widest">
            EP {episode.episode_number}
          </span>
          <h4 className="text-sm font-extrabold text-text-primary line-clamp-2 leading-tight group-hover:text-accent-cyan transition-colors">
            {episode.episode_title || `Episode ${episode.episode_number}`}
          </h4>
        </div>

        {/* Display native varying community ratings */}
        <div className="space-y-2 border-t border-border/40 pt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[10px] text-text-secondary font-semibold">Week of Air:</span>
            <span className="font-mono font-black text-accent-cyan">
              {scoreString}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-text-secondary font-mono">
            <span>{airDate}</span>
            <span>{reviewCount} reviews that week</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
