import React from 'react';
import { Review } from '@/types';

interface ReviewAuditLogProps {
  reviews: Review[];
}

export default function ReviewAuditLog({ reviews }: ReviewAuditLogProps) {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="p-6 border border-border rounded-xl bg-background text-center">
        <p className="text-xs text-text-secondary">No platform reviews registered within the air schedule window.</p>
      </div>
    );
  }

  const badgeStyles = {
    bomber: 'bg-danger/10 text-danger border-danger/20',
    inflator: 'bg-accent-gold/10 text-accent-gold border-accent-gold/20',
    genuine: 'bg-success/10 text-success border-success/20',
    unknown: 'bg-surface-elevated text-text-secondary border-border',
  };

  return (
    <div className="border border-border rounded-xl bg-background overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-surface-elevated/20 text-[10px] font-bold uppercase tracking-wider text-text-secondary border-b border-border">
            <th className="p-3">Identifier</th>
            <th className="p-3">Score</th>
            <th className="p-3">Audit Classification</th>
            <th className="p-3">Review snippet</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40 text-xs">
          {reviews.map((rev) => {
            const badge = badgeStyles[rev.category] || badgeStyles.unknown;
            return (
              <tr key={rev.id} className="hover:bg-surface-elevated/10">
                <td className="p-3 font-mono text-text-primary">{rev.display_id || 'user_anon'}</td>
                <td className="p-3 font-bold text-text-primary">{rev.score}/10</td>
                <td className="p-3">
                  <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${badge}`}>
                    {rev.category}
                  </span>
                </td>
                <td className="p-3 text-text-secondary max-w-xs truncate">{rev.review_text || 'No snippet loaded.'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
