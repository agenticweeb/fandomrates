"use client";

import React, { useState, useMemo } from 'react';
import { Episode, Review, ScoreSnapshot, AnomalyEvent, Season } from '@/types';
import EpisodeCard from './EpisodeCard';
import SeasonSelector from './SeasonSelector';
import EpisodeDetail from './EpisodeDetail';
import { motion, AnimatePresence } from 'framer-motion';

interface EpisodeGridProps {
  episodes: Episode[];
  reviews: Review[];
  snapshots: ScoreSnapshot[];
  anomalies: AnomalyEvent[];
  seasons: Season[];
}

export default function EpisodeGrid({
  episodes,
  reviews,
  snapshots,
  anomalies,
  seasons
}: EpisodeGridProps) {
  const [selectedSeasonId, setSelectedSeasonId] = useState<number>(0);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const episodesPerPage = 8;

  React.useEffect(() => {
    if (seasons.length > 0) {
      setSelectedSeasonId(seasons[0].id);
    }
  }, [seasons]);

  const filteredEpisodes = useMemo(() => {
    return episodes
      .filter((ep) => ep.season_id === selectedSeasonId)
      .sort((a, b) => a.episode_number - b.episode_number);
  }, [episodes, selectedSeasonId]);

  const handleSeasonChange = (id: number) => {
    setSelectedSeasonId(id);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredEpisodes.length / episodesPerPage);

  const paginatedEpisodes = useMemo(() => {
    const startIndex = (currentPage - 1) * episodesPerPage;
    return filteredEpisodes.slice(startIndex, startIndex + episodesPerPage);
  }, [filteredEpisodes, currentPage]);

  return (
    <div className="space-y-8">
      {/* 1. Season poster grid selector */}
      <SeasonSelector 
        seasons={seasons} 
        selectedSeasonId={selectedSeasonId} 
        onSelectSeason={handleSeasonChange} 
      />

      <div className="h-px bg-border/60"></div>

      {/* 2. Compact Paginated Episode Grid */}
      {filteredEpisodes.length === 0 ? (
        <div className="p-8 border border-border rounded-xl bg-surface text-center">
          <p className="text-sm text-text-secondary">No schedule nodes are populated for this story block yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {paginatedEpisodes.map((ep) => {
                // Find matching anomaly week (within 3 days of air date)
                const isAnomalyWeek = anomalies.some((anom) => {
                  if (!ep.aired_date) return false;
                  const anomTime = new Date(anom.detected_at).getTime();
                  const epTime = new Date(ep.aired_date).getTime();
                  return Math.abs(anomTime - epTime) <= 3 * 24 * 60 * 60 * 1000;
                });

                const epReviews = reviews.filter((r) => r.episode_id === ep.id);

                return (
                  <motion.div
                    key={ep.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <EpisodeCard
                      episode={ep}
                      overallScore={ep.rating ? Number(ep.rating) : null}
                      anomalyDetected={isAnomalyWeek}
                      reviewCount={epReviews.length}
                      onClick={() => setSelectedEpisode(ep)}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Grid pagination control buttons */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-surface/30 p-4 border border-border rounded-xl text-xs font-bold text-text-secondary">
              <span>
                Showing episodes { (currentPage - 1) * episodesPerPage + 1 } - { Math.min(currentPage * episodesPerPage, filteredEpisodes.length) } of { filteredEpisodes.length }
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded border border-border bg-surface hover:bg-surface-elevated hover:text-text-primary disabled:opacity-50 transition-colors"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded border border-border bg-surface hover:bg-surface-elevated hover:text-text-primary disabled:opacity-50 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Detail modal wrapper */}
      {selectedEpisode && (() => {
        const epDate = selectedEpisode.aired_date ? new Date(selectedEpisode.aired_date) : null;
        let matchedAnomaly: AnomalyEvent | null = null;

        if (epDate) {
          matchedAnomaly = anomalies.find((anom) => {
            const anomTime = new Date(anom.detected_at).getTime();
            const epTime = epDate.getTime();
            return Math.abs(anomTime - epTime) <= 3 * 24 * 60 * 60 * 1000;
          }) || null;
        }

        const epReviews = reviews.filter((r) => r.episode_id === selectedEpisode.id);

        return (
          <EpisodeDetail
            episode={selectedEpisode}
            reviews={epReviews}
            overallScoreWeekOfAiring={selectedEpisode.rating ? Number(selectedEpisode.rating) : null}
            anomalyDetected={matchedAnomaly !== null}
            scoreBefore={matchedAnomaly ? Number(matchedAnomaly.score_before) : null}
            scoreAfter={matchedAnomaly ? Number(matchedAnomaly.score_after) : null}
            onClose={() => setSelectedEpisode(null)}
          />
        );
      })()}
    </div>
  );
}
