"use client";

import React, { useState } from 'react';
import { Episode, Review, ScoreSnapshot, AnomalyEvent, Season } from '@/types';
import EpisodeCard from './EpisodeCard';
import SeasonSelector from './SeasonSelector';
import EpisodeDetail from './EpisodeDetail';

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
  const [selectedSeasonId, setSelectedSeasonId] = useState<number>(seasons[0]?.id || 0);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);

  const filteredEpisodes = episodes
    .filter((ep) => ep.season_id === selectedSeasonId)
    .sort((a, b) => a.episode_number - b.episode_number);

  React.useEffect(() => {
    if (seasons.length > 0 && selectedSeasonId === 0) {
      setSelectedSeasonId(seasons[0].id);
    }
  }, [seasons, selectedSeasonId]);

  return (
    <div className="space-y-8">
      {/* 1. Immersive Poster Selection grid */}
      <SeasonSelector 
        seasons={seasons} 
        selectedSeasonId={selectedSeasonId} 
        onSelectSeason={setSelectedSeasonId} 
      />

      <div className="h-px bg-border/60"></div>

      {/* 2. Episode Grid mapping */}
      {filteredEpisodes.length === 0 ? (
        <div className="p-8 border border-border rounded-xl bg-surface text-center">
          <p className="text-sm text-text-secondary">No episode listings have been populated for this season.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredEpisodes.map((ep) => {
            // Find closest score snapshot
            const epDate = ep.aired_date ? new Date(ep.aired_date) : null;
            let matchedScore: number | null = null;
            if (epDate && snapshots.length > 0) {
              const closest = snapshots.reduce((prev, curr) => {
                const prevDiff = Math.abs(new Date(prev.scraped_at).getTime() - epDate.getTime());
                const currDiff = Math.abs(new Date(curr.scraped_at).getTime() - epDate.getTime());
                return currDiff < prevDiff ? prev : curr;
              });
              matchedScore = closest.score;
            }

            // Anomaly window check (within 3 days)
            const isAnomalyWeek = anomalies.some((anom) => {
              if (!ep.aired_date) return false;
              const anomTime = new Date(anom.detected_at).getTime();
              const epTime = new Date(ep.aired_date).getTime();
              return Math.abs(anomTime - epTime) <= 3 * 24 * 60 * 60 * 1000;
            });

            const epReviews = reviews.filter((r) => r.episode_id === ep.id);

            return (
              <EpisodeCard
                key={ep.id}
                episode={ep}
                overallScore={matchedScore}
                anomalyDetected={isAnomalyWeek}
                reviewCount={epReviews.length}
                onClick={() => setSelectedEpisode(ep)}
              />
            );
          })}
        </div>
      )}

      {/* 3. Immersive Detail Modal popover */}
      {selectedEpisode && (() => {
        const epDate = selectedEpisode.aired_date ? new Date(selectedEpisode.aired_date) : null;
        let matchedScore: number | null = null;
        let matchedAnomaly: AnomalyEvent | null = null;

        if (epDate && snapshots.length > 0) {
          const closest = snapshots.reduce((prev, curr) => {
            const prevDiff = Math.abs(new Date(prev.scraped_at).getTime() - epDate.getTime());
            const currDiff = Math.abs(new Date(curr.scraped_at).getTime() - epDate.getTime());
            return currDiff < prevDiff ? prev : curr;
          });
          matchedScore = closest.score;
        }

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
            overallScoreWeekOfAiring={matchedScore}
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
