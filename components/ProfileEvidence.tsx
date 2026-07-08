"use client";

import React, { useState, useMemo } from 'react';
import { SuspiciousProfile } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileEvidenceProps {
  profiles: SuspiciousProfile[];
  animeMap: { [key: number]: { title: string; colorClass: string; borderClass: string } };
}

export default function ProfileEvidence({ profiles, animeMap }: ProfileEvidenceProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const rowsPerPage = 20;

  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      const matchSearch = (p.display_id || p.username || '').toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [profiles, search, categoryFilter]);

  const paginatedProfiles = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredProfiles.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredProfiles, currentPage]);

  const totalPages = Math.ceil(filteredProfiles.length / rowsPerPage);

  const categoryLabels: { [key: string]: { label: string; style: string } } = {
    rival_fandom: { label: 'Rival Fan Hit', style: 'bg-danger/10 text-danger border-danger/30' },
    burner: { label: 'Fresh Account', style: 'bg-accent-gold/10 text-accent-gold border-accent-gold/30' },
    inflation: { label: 'Rating Inflation', style: 'bg-accent-mushoku/10 text-accent-mushoku border-accent-mushoku/30' },
    unknown: { label: 'The Extremist', style: 'bg-surface-elevated text-text-secondary border-border' },
  };

  return (
    <div className="space-y-6">
      {/* Filters & Control bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between bg-surface/50 p-4 border border-border rounded-xl">
        <input
          type="text"
          placeholder="Search by anonymized handle (e.g. user_...)"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          className="flex-grow max-w-md rounded-lg border border-border bg-background p-2.5 text-xs text-text-primary focus:outline-none focus:border-accent-cyan"
        />

        <div className="flex items-center gap-3">
          <label className="text-xs font-black uppercase tracking-widest text-text-secondary">Class:</label>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-xs font-extrabold text-text-primary focus:outline-none"
          >
            <option value="all">Show All Profiles</option>
            <option value="rival_fandom">Rival Fan Hit</option>
            <option value="burner">Fresh Accounts</option>
            <option value="inflation">Score Inflation</option>
            <option value="unknown">The Extremist</option>
          </select>
        </div>
      </div>

      {/* 1. Desktop & Tablet Mode (Table) */}
      <div className="hidden md:block border border-border rounded-xl bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-elevated/50 text-[10px] font-black uppercase tracking-widest text-text-secondary border-b border-border">
                <th className="p-4">User ID</th>
                <th className="p-4">Show</th>
                <th className="p-4">Site</th>
                <th className="p-4">Score</th>
                <th className="p-4">Flag</th>
                <th className="p-4 text-right">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-sm">
              {paginatedProfiles.length > 0 ? (
                paginatedProfiles.map((profile) => {
                  const badge = categoryLabels[profile.category ?? 'unknown'] || categoryLabels.unknown;
                  const isExpanded = expandedId === profile.id;
                  const targetAnime = animeMap[profile.anime_id] || { 
                    title: 'Unknown Title', 
                    colorClass: 'text-text-secondary bg-surface', 
                    borderClass: 'border-border' 
                  };

                  return (
                    <React.Fragment key={profile.id}>
                      <tr className="hover:bg-surface-elevated/20 transition-colors">
                        <td className="p-4 font-mono font-extrabold text-text-primary">
                          {profile.display_id || 'user_anon'}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex px-2.5 py-1 text-[11px] font-black rounded border ${targetAnime.colorClass} ${targetAnime.borderClass}`}>
                            {targetAnime.title}
                          </span>
                        </td>
                        <td className="p-4 text-xs font-black uppercase tracking-wider text-text-secondary">
                          {profile.platform}
                        </td>
                        <td className="p-4">
                          <span className="font-mono font-black text-text-primary bg-background border border-border px-2.5 py-1 rounded">
                            {profile.rating_given}/10
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex px-2.5 py-1 text-[11px] font-extrabold rounded-full border ${badge.style}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : profile.id)}
                            className="text-xs font-bold text-accent-cyan hover:underline hover:text-accent-cyan/80"
                          >
                            {isExpanded ? 'Hide' : 'Inspect'}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable JSON Evidence */}
                      {isExpanded && (
                        <tr className="bg-background/40">
                          <td colSpan={6} className="p-6 border-b border-border">
                            <div className="bg-[#050508] border border-border/80 rounded-xl p-5 font-mono text-xs text-text-secondary overflow-x-auto max-w-4xl mx-auto">
                              <p className="text-accent-gold mb-3 font-black">// AUDIT TRAIL LOG EVIDENCE PAYLOAD</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-text-secondary border-b border-border/50 pb-4">
                                <div>
                                  <span className="text-text-primary font-bold">Account Age:</span> {profile.evidence?.account_age_days ? `${Math.round(profile.evidence.account_age_days)} days` : 'N/A'}
                                </div>
                                <div>
                                  <span className="text-text-primary font-bold">Library Size:</span> {profile.evidence?.list_count ?? 'N/A'} entries
                                </div>
                                <div>
                                  <span className="text-text-primary font-bold">Mean Given Score:</span> {profile.evidence?.mean_score ?? 'N/A'} / 10
                                </div>
                                <div>
                                  <span className="text-text-primary font-bold">Platform ID:</span> {profile.platform_user_id || 'Hidden'}
                                </div>
                              </div>
                              <div>
                                <span className="text-text-primary font-bold">// Public Favorites Shelf Preview:</span>
                                {profile.evidence?.favorites && profile.evidence.favorites.length > 0 ? (
                                  <ul className="list-disc pl-5 mt-2 space-y-1 text-text-secondary">
                                    {profile.evidence.favorites.map((fav: string, i: number) => (
                                      <li key={i}>{fav}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="italic text-text-secondary mt-1">Favorites shelf set to private or empty.</p>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-text-secondary">
                    No suspicious profiles flagged.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Adaptive Mobile Mode (Visual Stacked Cards) [7.5] */}
      <div className="block md:hidden space-y-4">
        {paginatedProfiles.length > 0 ? (
          paginatedProfiles.map((profile) => {
            const badge = categoryLabels[profile.category ?? 'unknown'] || categoryLabels.unknown;
            const isExpanded = expandedId === profile.id;
            const targetAnime = animeMap[profile.anime_id] || { 
              title: 'Unknown Title', 
              colorClass: 'text-text-secondary bg-surface', 
              borderClass: 'border-border' 
            };

            return (
              <div 
                key={profile.id}
                className="border border-border rounded-xl bg-surface p-4 space-y-3 shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-xs font-mono font-black text-text-primary block">
                      {profile.display_id || 'user_anon'}
                    </span>
                    <span className={`inline-flex px-2 py-0.5 text-[10px] font-black rounded border ${targetAnime.colorClass} ${targetAnime.borderClass}`}>
                      {targetAnime.title}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-black bg-background border border-border px-2 py-0.5 rounded">
                    {profile.rating_given}/10
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-border/40">
                  <span className={`inline-flex px-2.5 py-0.5 text-[10px] font-extrabold rounded-full border ${badge.style}`}>
                    {badge.label}
                  </span>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : profile.id)}
                    className="text-xs font-black text-accent-cyan hover:underline"
                  >
                    {isExpanded ? 'Hide Evidence' : 'Inspect Evidence'}
                  </button>
                </div>

                {/* Expandable JSON block on mobile */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden pt-2"
                    >
                      <div className="bg-[#050508] border border-border/80 rounded-lg p-4 font-mono text-[11px] text-text-secondary space-y-3">
                        <p className="text-accent-gold font-black border-b border-border/50 pb-1">// AUDIO LOG PROOF</p>
                        <div className="space-y-1.5">
                          <div><span className="text-text-primary font-bold">Age:</span> {profile.evidence?.account_age_days ? `${Math.round(profile.evidence.account_age_days)} days` : 'N/A'}</div>
                          <div><span className="text-text-primary font-bold">List size:</span> {profile.evidence?.list_count ?? 'N/A'} completed</div>
                          <div><span className="text-text-primary font-bold">Mean Score:</span> {profile.evidence?.mean_score ?? 'N/A'} / 10</div>
                        </div>
                        {profile.evidence?.favorites && profile.evidence.favorites.length > 0 && (
                          <div className="pt-2 border-t border-border/50">
                            <span className="text-text-primary font-bold">Favorites:</span>
                            <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[10px]">
                              {profile.evidence.favorites.slice(0, 3).map((f: string, idx: number) => (
                                <li key={idx}>{f}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        ) : (
          <div className="p-6 border border-border rounded-xl bg-surface text-center text-xs text-text-secondary">
            No suspicious profiles flagged.
          </div>
        )}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border bg-surface-elevated/40 p-4 text-xs font-bold text-text-secondary">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded border border-border bg-surface hover:bg-surface-elevated disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded border border-border bg-surface hover:bg-surface-elevated disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
