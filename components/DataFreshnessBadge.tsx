import React from 'react';

interface DataFreshnessBadgeProps {
  scrapedAt: string | null;
  source?: string;
  runStatus?: 'succeeded' | 'partial' | 'failed' | 'unavailable';
  coverage?: string;
}

export default function DataFreshnessBadge({ scrapedAt, source, runStatus, coverage }: DataFreshnessBadgeProps) {
  if (runStatus === 'failed' || runStatus === 'unavailable') {
    return <span className="inline-flex items-center gap-1.5 rounded-full border border-danger/30 bg-danger/10 px-3 py-1 text-xs font-semibold text-danger">{source ? `${source}: ` : ''}Unavailable</span>;
  }
  if (!scrapedAt) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-surface-elevated text-text-secondary border border-border">
        ● Unknown Freshness
      </span>
    );
  }

  const scrapedDate = new Date(scrapedAt);
  const now = new Date();
  const diffTime = Math.max(0, now.getTime() - scrapedDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let colorClass = "bg-success/10 text-success border-success/30";
  let statusText = runStatus === 'partial' ? "Partial" : "Observed";

  if (diffDays > 14) {
    colorClass = "bg-danger/10 text-danger border-danger/30";
    statusText = "Stale";
  } else if (diffDays > 7) {
    colorClass = "bg-accent-gold/10 text-accent-gold border-accent-gold/30";
    statusText = "Stale";
  }

  const formattedDate = scrapedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${colorClass}`}>
        <span className="w-2 h-2 rounded-full bg-current"></span>
        {source ? `${source}: ` : ''}{statusText} ({diffDays} {diffDays === 1 ? 'day' : 'days'} ago)
      </span>
      <span className="text-xs text-text-secondary">
        As of {formattedDate}{coverage ? ` • ${coverage}` : ''}
      </span>
    </div>
  );
}
