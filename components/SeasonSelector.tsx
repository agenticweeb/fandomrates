import React from 'react';
import { Season } from '@/types';

interface SeasonSelectorProps {
  seasons: Season[];
  selectedSeasonId: number;
  onSelectSeason: (id: number) => void;
}

export default function SeasonSelector({ seasons, selectedSeasonId, onSelectSeason }: SeasonSelectorProps) {
  if (!seasons || seasons.length === 0) return null;

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-bold uppercase tracking-widest text-text-secondary">Select Active Story Arc</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {seasons.map((s) => {
          const isSelected = s.id === selectedSeasonId;
          return (
            <div
              key={s.id}
              onClick={() => onSelectSeason(s.id)}
              className={`group cursor-pointer border rounded-2xl overflow-hidden bg-surface transition-all duration-300 transform hover:scale-[1.02] ${
                isSelected 
                  ? 'border-accent-cyan shadow-lg shadow-accent-cyan/10 bg-surface-elevated' 
                  : 'border-border hover:border-text-secondary/40'
              }`}
            >
              {/* Poster card artwork element */}
              <div className="relative aspect-[3/4] bg-background border-b border-border overflow-hidden">
                {s.cover_image_url ? (
                  <img
                    src={s.cover_image_url}
                    alt={s.title_english || `Season ${s.season_number}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface to-background text-text-secondary">
                    Poster N/A
                  </div>
                )}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-accent-cyan flex items-center justify-center text-[10px] text-background font-bold">
                    ✓
                  </div>
                )}
              </div>

              {/* Poster text content */}
              <div className="p-3.5 space-y-1">
                <span className="text-[10px] font-bold text-accent-gold uppercase tracking-wider">
                  Season {s.season_number}
                </span>
                <h5 className="text-xs font-bold text-text-primary truncate">
                  {s.title || `Season ${s.season_number}`}
                </h5>
                <p className="text-[10px] text-text-secondary font-mono">
                  {s.episode_count ?? '??'} milestone episodes
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
