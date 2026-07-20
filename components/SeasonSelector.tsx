"use client";

import React from 'react';
import { Season } from '@/types';
import { motion } from 'framer-motion';

interface SeasonSelectorProps {
  seasons: Season[];
  selectedSeasonId: number;
  onSelectSeason: (id: number) => void;
}

export default function SeasonSelector({ seasons, selectedSeasonId, onSelectSeason }: SeasonSelectorProps) {
  if (!seasons || seasons.length === 0) return null;

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-black uppercase tracking-widest text-text-secondary">
        Select Active Franchise Block
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {seasons.map((s, idx) => {
          const isSelected = s.id === selectedSeasonId;
          return (
            <motion.div
              key={s.id}
              onClick={() => onSelectSeason(s.id)}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className={`cursor-pointer rounded-2xl overflow-hidden bg-surface border transition-all duration-300 relative ${
                isSelected 
                  ? 'border-accent-cyan shadow-[0_0_20px_rgba(6,182,212,0.15)] bg-surface-elevated' 
                  : 'border-border hover:border-text-secondary/40 hover:shadow-[0_0_15px_rgba(255,255,255,0.02)]'
              }`}
            >
              {/* Poster Art with subtle loading skeleton state */}
              <div className="relative aspect-[3/4] bg-[#0d0d14] border-b border-border overflow-hidden">
                {s.cover_image_url ? (
                  <img
                    src={s.cover_image_url}
                    alt={s.title_english || `Season ${s.season_number}`}
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
                    alt={s.title_english || `Season ${s.season_number}`}
                    className="w-full h-full object-cover"
                  />
                )}
                {isSelected && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-accent-cyan flex items-center justify-center text-xs text-background font-black shadow-lg">
                    ✓
                  </div>
                )}
              </div>

              {/* Details and Episode Counts */}
              <div className="p-4 space-y-1 bg-surface-elevated/40">
                <span className="text-[10px] font-black text-accent-gold uppercase tracking-widest">
                  Season {s.season_number}
                </span>
                <h5 className="text-sm font-extrabold text-text-primary truncate">
                  {s.title || `Season ${s.season_number}`}
                </h5>
                <p className="text-[11px] text-text-secondary font-mono font-medium">
                  {s.episode_count ?? '??'} milestone nodes
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
