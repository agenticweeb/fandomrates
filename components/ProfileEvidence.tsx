"use client";

import React, { useState } from 'react';
import { SuspiciousProfile } from '@/types';

interface ProfileEvidenceProps {
  profiles: SuspiciousProfile[];
}

export default function ProfileEvidence({ profiles }: ProfileEvidenceProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (!profiles || profiles.length === 0) {
    return (
      <div className="p-8 border border-border rounded-xl bg-surface text-center">
        <p className="text-sm text-text-secondary">No suspicious profiles have been flagged in recent audits.</p>
      </div>
    );
  }

  const categoryLabels: { [key: string]: { label: string; style: string } } = {
    rival_fandom: { label: 'Rival Fandom Sabotage', style: 'bg-danger/10 text-danger border-danger/20' },
    burner: { label: 'Burner Account', style: 'bg-accent-gold/10 text-accent-gold border-accent-gold/20' },
    inflation: { label: 'Rating Inflation', style: 'bg-accent-mushoku/10 text-accent-mushoku border-accent-mushoku/20' },
    unknown: { label: 'Irregular Pattern', style: 'bg-surface-elevated text-text-secondary border-border' },
  };

  return (
    <div className="border border-border rounded-xl bg-surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-elevated/50 text-xs font-bold uppercase tracking-wider text-text-secondary border-b border-border">
              <th className="p-4">Anonymized Identifier</th>
              <th className="p-4">Platform</th>
              <th className="p-4">Rating</th>
              <th className="p-4">Classification</th>
              <th className="p-4 text-right">Inspection</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-sm">
            {profiles.map((profile) => {
              const badge = categoryLabels[profile.category] || categoryLabels.unknown;
              const isExpanded = expandedId === profile.id;

              return (
                <React.Fragment key={profile.id}>
                  <tr className="hover:bg-surface-elevated/20 transition-colors">
                    <td className="p-4 font-mono font-medium text-text-primary">
                      {profile.display_id || 'user_anon'}
                    </td>
                    <td className="p-4 text-xs uppercase font-bold tracking-wider text-text-secondary">
                      {profile.platform}
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-text-primary bg-background border border-border px-2 py-0.5 rounded">
                        {profile.rating_given}/10
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full border ${badge.style}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : profile.id)}
                        className="text-xs text-accent-cyan hover:underline hover:text-accent-cyan/80 font-medium"
                      >
                        {isExpanded ? 'Hide Payload' : 'Audit Data'}
                      </button>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className="bg-background/40">
                      <td colSpan={5} className="p-6 border-b border-border">
                        <div className="bg-[#050508] border border-border/80 rounded-lg p-4 font-mono text-xs text-text-secondary overflow-x-auto max-w-4xl mx-auto">
                          <p className="text-text-primary mb-2 font-semibold">// Audit Trail Evidence Payload</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-text-secondary border-b border-border/50 pb-4">
                            <div>
                              <span className="text-accent-gold">Account Age:</span> {profile.evidence?.account_age_days ? `${Math.round(profile.evidence.account_age_days)} days` : 'N/A'}
                            </div>
                            <div>
                              <span className="text-accent-gold">Library List Size:</span> {profile.evidence?.list_count ?? 'N/A'} completed entries
                            </div>
                            <div>
                              <span className="text-accent-gold">Mean Given Score:</span> {profile.evidence?.mean_score ?? 'N/A'} / 10
                            </div>
                            <div>
                              <span className="text-accent-gold">Platform Flagged ID:</span> {profile.platform_user_id || 'Hidden'}
                            </div>
                          </div>
                          <div>
                            <span className="text-text-primary font-semibold">// Public Favorites Shelf Preview:</span>
                            {profile.evidence?.favorites && profile.evidence.favorites.length > 0 ? (
                              <ul className="list-disc pl-5 mt-1 space-y-1">
                                {profile.evidence.favorites.map((fav: string, i: number) => (
                                  <li key={i} className="text-text-secondary">{fav}</li>
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
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
