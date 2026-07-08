"use client";

import React, { useMemo } from 'react';
import { SuspiciousProfile } from '@/types';
import { motion } from 'framer-motion';

interface PlatformBattlegroundsProps {
  profiles: SuspiciousProfile[];
  animeA_id: number;
  animeB_id: number;
  animeA_title: string;
  animeB_title: string;
}

export default function PlatformBattlegrounds({
  profiles,
  animeA_id,
  animeB_id,
  animeA_title,
  animeB_title
}: PlatformBattlegroundsProps) {

  // Compile metrics
  const stats = useMemo(() => {
    const calculatePlatformRatios = (animeId: number) => {
      const subset = profiles.filter(p => p.anime_id === animeId);
      
      // MyAnimeList Metrics
      const malProfiles = subset.filter(p => p.platform === 'mal');
      const malBombers = malProfiles.filter(p => (p.rating_given ?? 5) <= 2).length;
      const malGlazers = malProfiles.filter(p => (p.rating_given ?? 5) >= 9).length;
      const malTotal = malProfiles.length || 1;

      // AniList Metrics
      const alProfiles = subset.filter(p => p.platform === 'anilist');
      const alBombers = alProfiles.filter(p => (p.rating_given ?? 5) <= 2).length;
      const alGlazers = alProfiles.filter(p => (p.rating_given ?? 5) >= 9).length;
      const alTotal = alProfiles.length || 1;

      return {
        mal: {
          bomberPct: Math.round((malBombers / malTotal) * 100),
          glazerPct: Math.round((malGlazers / malTotal) * 100),
          total: malProfiles.length
        },
        anilist: {
          bomberPct: Math.round((alBombers / alTotal) * 100),
          glazerPct: Math.round((alGlazers / alTotal) * 100),
          total: alProfiles.length
        }
      };
    };

    return {
      animeA: calculatePlatformRatios(animeA_id),
      animeB: calculatePlatformRatios(animeB_id)
    };
  }, [profiles, animeA_id, animeB_id]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      
      {/* Anime A (Mushoku Tensei) Platform Metrics */}
      <div className="border border-border rounded-2xl bg-surface p-6 space-y-6 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-mushoku/5 to-transparent pointer-events-none" />
        <div>
          <span className="text-[10px] font-black uppercase text-accent-mushoku bg-accent-mushoku/10 px-2.5 py-1 rounded border border-accent-mushoku/20">
            Fandom Hub A
          </span>
          <h4 className="text-lg font-black text-text-primary mt-2">{animeA_title}</h4>
          <p className="text-xs text-text-secondary mt-1">Platform-level distribution of glazers and toxic bombers.</p>
        </div>

        <div className="space-y-4 font-mono text-xs">
          {/* MyAnimeList metrics */}
          <div className="space-y-2">
            <div className="flex justify-between text-text-secondary">
              <span>MyAnimeList (MAL) ({stats.animeA.mal.total} audited)</span>
              <span className="text-danger font-bold">{stats.animeA.mal.bomberPct}% Bombers</span>
            </div>
            <div className="h-3 w-full bg-background rounded-full overflow-hidden flex">
              <div className="bg-danger" style={{ width: `${stats.animeA.mal.bomberPct}%` }} />
              <div className="bg-accent-gold" style={{ width: `${stats.animeA.mal.glazerPct}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-text-secondary">
              <span>💣 {stats.animeA.mal.bomberPct}% Saboteurs</span>
              <span>🔥 {stats.animeA.mal.glazerPct}% Inflators</span>
            </div>
          </div>

          {/* AniList metrics */}
          <div className="space-y-2 pt-2 border-t border-border/40">
            <div className="flex justify-between text-text-secondary">
              <span>AniList ({stats.animeA.anilist.total} audited)</span>
              <span className="text-accent-gold font-bold">{stats.animeA.anilist.glazerPct}% Glazers</span>
            </div>
            <div className="h-3 w-full bg-background rounded-full overflow-hidden flex">
              <div className="bg-danger" style={{ width: `${stats.animeA.anilist.bomberPct}%` }} />
              <div className="bg-accent-gold" style={{ width: `${stats.animeA.anilist.glazerPct}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-text-secondary">
              <span>💣 {stats.animeA.anilist.bomberPct}% Saboteurs</span>
              <span>🔥 {stats.animeA.anilist.glazerPct}% Inflators</span>
            </div>
          </div>
        </div>
      </div>

      {/* Anime B (Re:Zero) Platform Metrics */}
      <div className="border border-border rounded-2xl bg-surface p-6 space-y-6 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-rezero/5 to-transparent pointer-events-none" />
        <div>
          <span className="text-[10px] font-black uppercase text-accent-rezero bg-accent-rezero/10 px-2.5 py-1 rounded border border-accent-rezero/20">
            Fandom Hub B
          </span>
          <h4 className="text-lg font-black text-text-primary mt-2">{animeB_title}</h4>
          <p className="text-xs text-text-secondary mt-1">Platform-level distribution of glazers and toxic bombers.</p>
        </div>

        <div className="space-y-4 font-mono text-xs">
          {/* MyAnimeList metrics */}
          <div className="space-y-2">
            <div className="flex justify-between text-text-secondary">
              <span>MyAnimeList (MAL) ({stats.animeB.mal.total} audited)</span>
              <span className="text-danger font-bold">{stats.animeB.mal.bomberPct}% Bombers</span>
            </div>
            <div className="h-3 w-full bg-background rounded-full overflow-hidden flex">
              <div className="bg-danger" style={{ width: `${stats.animeB.mal.bomberPct}%` }} />
              <div className="bg-accent-gold" style={{ width: `${stats.animeB.mal.glazerPct}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-text-secondary">
              <span>💣 {stats.animeB.mal.bomberPct}% Saboteurs</span>
              <span>🔥 {stats.animeB.mal.glazerPct}% Inflators</span>
            </div>
          </div>

          {/* AniList metrics */}
          <div className="space-y-2 pt-2 border-t border-border/40">
            <div className="flex justify-between text-text-secondary">
              <span>AniList ({stats.animeB.anilist.total} audited)</span>
              <span className="text-accent-gold font-bold">{stats.animeB.anilist.glazerPct}% Glazers</span>
            </div>
            <div className="h-3 w-full bg-background rounded-full overflow-hidden flex">
              <div className="bg-danger" style={{ width: `${stats.animeB.anilist.bomberPct}%` }} />
              <div className="bg-accent-gold" style={{ width: `${stats.animeB.anilist.glazerPct}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-text-secondary">
              <span>💣 {stats.animeB.anilist.bomberPct}% Saboteurs</span>
              <span>🔥 {stats.animeB.anilist.glazerPct}% Inflators</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
