import React from 'react';
import { Episode, Review } from '@/types';
import ReviewAuditLog from './ReviewAuditLog';

interface EpisodeDetailProps {
  episode: Episode;
  reviews: Review[];
  overallScoreWeekOfAiring: number | null;
  anomalyDetected: boolean;
  scoreBefore: number | null;
  scoreAfter: number | null;
  onClose: () => void;
}

export default function EpisodeDetail({
  episode,
  reviews,
  overallScoreWeekOfAiring,
  anomalyDetected,
  scoreBefore,
  scoreAfter,
  onClose
}: EpisodeDetailProps) {
  const bombers = reviews.filter((r) => r.category === 'bomber').length;
  const inflators = reviews.filter((r) => r.category === 'inflator').length;
  const genuines = reviews.filter((r) => r.category === 'genuine').length;

  const delta = scoreAfter && scoreBefore ? scoreAfter - scoreBefore : null;

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="border border-border rounded-2xl bg-surface max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl relative">
        
        {/* Blurry cinematic background overlay */}
        {episode.thumbnail_url && (
          <div 
            className="absolute inset-0 bg-cover bg-center -z-10 opacity-15 blur-2xl transform scale-110"
            style={{ backgroundImage: `url('${episode.thumbnail_url}')` }}
          ></div>
        )}

        {/* Header container with streaming preview banner */}
        <div className="relative aspect-[21/9] md:aspect-[24/8] w-full bg-background border-b border-border overflow-hidden">
          {episode.thumbnail_url ? (
            <img
              src={episode.thumbnail_url}
              alt="Episode Preview banner"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = "/images/fallback-image.svg";
              }}
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src="/images/fallback-image.svg"
              alt="Episode Preview banner"
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent"></div>
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-background bg-text-primary hover:bg-text-primary/80 text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-lg z-20"
          >
            ✕
          </button>

          <div className="absolute bottom-6 left-6 z-10 max-w-xl">
            <span className="text-[10px] font-extrabold text-accent-gold uppercase tracking-widest bg-background/60 border border-border px-2 py-0.5 rounded backdrop-blur-sm">
              Episode {episode.episode_number} Milestone Detail
            </span>
            <h3 className="text-xl md:text-2xl font-extrabold text-text-primary mt-2 drop-shadow-md">
              {episode.episode_title || `Episode ${episode.episode_number}`}
            </h3>
          </div>
        </div>

        {/* Content Container */}
        <div className="p-6 overflow-y-auto space-y-8 flex-grow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Week of Airing Score Card */}
            <div className="p-5 border border-border rounded-xl bg-background space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Score Analysis (Week of Airing)</h4>
              
              <div className="flex items-center gap-4">
                <div className="text-center bg-surface border border-border px-4 py-3 rounded-lg flex-1">
                  <span className="text-xs text-text-secondary">Overall Score</span>
                  <div className="text-2xl font-black text-accent-cyan mt-1">
                    {overallScoreWeekOfAiring ? overallScoreWeekOfAiring.toFixed(2) : 'N/A'}
                  </div>
                </div>

                {delta !== null && (
                  <div className="text-center bg-surface border border-border px-4 py-3 rounded-lg flex-1">
                    <span className="text-xs text-text-secondary">Deviation Delta</span>
                    <div className={`text-2xl font-black mt-1 ${delta < 0 ? 'text-danger' : 'text-success'}`}>
                      {delta > 0 ? '+' : ''}{delta.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>

              {anomalyDetected && (
                <div className="p-3 bg-danger/10 border border-danger/20 text-xs text-danger rounded-lg font-medium">
                  ⚠️ Score anomaly was flagged during the temporal window of this episode.
                </div>
              )}
            </div>

            {/* Proximity Reviews Breakdown */}
            <div className="p-5 border border-border rounded-xl bg-background space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Audited Reviews Breakdown</h4>
              
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
                <div className="p-2 border border-danger/20 bg-danger/5 rounded-lg text-danger">
                  <div>Bombers</div>
                  <div className="text-lg font-black mt-1">{bombers}</div>
                </div>
                <div className="p-2 border border-success/20 bg-success/5 rounded-lg text-success">
                  <div>Genuines</div>
                  <div className="text-lg font-black mt-1">{genuines}</div>
                </div>
                <div className="p-2 border border-accent-gold/20 bg-accent-gold/5 rounded-lg text-accent-gold">
                  <div>Inflators</div>
                  <div className="text-lg font-black mt-1">{inflators}</div>
                </div>
              </div>

              <div className="text-[10px] text-text-secondary font-mono text-center">
                Review window: Air Date ±3 days. Correlation does not equal causation [14].
              </div>
            </div>
          </div>

          {/* Audit Logs */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Reviews Audit logs</h4>
            <ReviewAuditLog reviews={reviews} />
          </div>
        </div>

        {/* Disclaimer Footer */}
        <div className="p-4 border-t border-border bg-surface-elevated/40 text-center text-[10px] text-text-secondary">
          Scores reflect overall franchise rankings logged during the air schedule. Proximity reviews pulled dynamically from public MAL caches.
        </div>
      </div>
    </div>
  );
}
