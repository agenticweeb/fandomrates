"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function MethodologyPage() {
  const [loading, setLoading] = useState<string | null>(null);

  // Compiles database datasets to local downloads instantly
  const handleExport = async (table: string, format: 'csv' | 'json') => {
    setLoading(`${table}-${format}`);
    try {
      const { data, error } = await supabase.from(table).select('*');
      if (error) throw error;

      let fileContent = '';
      let mimeType = '';
      let fileExtension = '';

      if (format === 'json') {
        fileContent = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        fileExtension = 'json';
      } else {
        // Convert to CSV
        if (data && data.length > 0) {
          const headers = Object.keys(data[0]);
          const csvRows = [headers.join(',')];
          for (const row of data) {
            const values = headers.map(header => {
              const val = row[header];
              const escaped = ('' + (val ?? '')).replace(/"/g, '""');
              return `"${escaped}"`;
            });
            csvRows.push(values.join(','));
          }
          fileContent = csvRows.join('\n');
        }
        mimeType = 'text/csv';
        fileExtension = 'csv';
      }

      const blob = new Blob([fileContent], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `fandomrates_${table}_export.${fileExtension}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e: any) {
      alert(`Export Failed: ${e.message}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-12">
      <div className="space-y-4">
        <h1 className="text-4xl font-black text-text-primary uppercase tracking-tight">
          Systems Audits & Transparency Metrics
        </h1>
        <p className="text-base text-text-secondary leading-relaxed">
          FandomRates acts as an independent auditor. We publish our database metrics and open source our parameters because transparency builds trust.
        </p>
      </div>

      {/* CSV/JSON Download Card */}
      <section className="p-6 border border-border rounded-2xl bg-surface space-y-6">
        <div>
          <h3 className="text-lg font-black text-text-primary uppercase tracking-wider">Raw Database Exporters</h3>
          <p className="text-xs text-text-secondary mt-1">
            Expose and download raw platform parameters directly. No registration needed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Table Box 1 */}
          <div className="p-4 rounded-xl border border-border bg-background space-y-4 flex flex-col justify-between">
            <div>
              <h4 className="font-extrabold text-sm text-text-primary uppercase">Scoring snaps</h4>
              <p className="text-[11px] text-text-secondary mt-1">Platform averages snap records histories.</p>
            </div>
            <div className="flex gap-2">
              <button 
                disabled={loading !== null}
                onClick={() => handleExport('score_snapshots', 'csv')}
                className="flex-1 py-2 text-[10px] font-black uppercase tracking-wider bg-surface border border-border hover:border-text-secondary rounded text-text-primary disabled:opacity-50"
              >
                CSV
              </button>
              <button 
                disabled={loading !== null}
                onClick={() => handleExport('score_snapshots', 'json')}
                className="flex-1 py-2 text-[10px] font-black uppercase tracking-wider bg-surface border border-border hover:border-text-secondary rounded text-text-primary disabled:opacity-50"
              >
                JSON
              </button>
            </div>
          </div>

          {/* Table Box 2 */}
          <div className="p-4 rounded-xl border border-border bg-background space-y-4 flex flex-col justify-between">
            <div>
              <h4 className="font-extrabold text-sm text-text-primary uppercase">Flagged profiles</h4>
              <p className="text-[11px] text-text-secondary mt-1">Behavioral profiles flagged under audits.</p>
            </div>
            <div className="flex gap-2">
              <button 
                disabled={loading !== null}
                onClick={() => handleExport('suspicious_profiles', 'csv')}
                className="flex-1 py-2 text-[10px] font-black uppercase tracking-wider bg-surface border border-border hover:border-text-secondary rounded text-text-primary disabled:opacity-50"
              >
                CSV
              </button>
              <button 
                disabled={loading !== null}
                onClick={() => handleExport('suspicious_profiles', 'json')}
                className="flex-1 py-2 text-[10px] font-black uppercase tracking-wider bg-surface border border-border hover:border-text-secondary rounded text-text-primary disabled:opacity-50"
              >
                JSON
              </button>
            </div>
          </div>

          {/* Table Box 3 */}
          <div className="p-4 rounded-xl border border-border bg-background space-y-4 flex flex-col justify-between">
            <div>
              <h4 className="font-extrabold text-sm text-text-primary uppercase">Anomalies log</h4>
              <p className="text-[11px] text-text-secondary mt-1">Historical score drop/spike timelines.</p>
            </div>
            <div className="flex gap-2">
              <button 
                disabled={loading !== null}
                onClick={() => handleExport('anomaly_events', 'csv')}
                className="flex-1 py-2 text-[10px] font-black uppercase tracking-wider bg-surface border border-border hover:border-text-secondary rounded text-text-primary disabled:opacity-50"
              >
                CSV
              </button>
              <button 
                disabled={loading !== null}
                onClick={() => handleExport('anomaly_events', 'json')}
                className="flex-1 py-2 text-[10px] font-black uppercase tracking-wider bg-surface border border-border hover:border-text-secondary rounded text-text-primary disabled:opacity-50"
              >
                JSON
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Technical definitions explained */}
      <section className="space-y-4 border-l-2 border-accent-gold pl-6">
        <h3 className="text-lg font-black text-text-primary uppercase tracking-widest">1. Correlation, Not Causation</h3>
        <p className="text-sm text-text-secondary leading-relaxed">
          FandomRates does not have access to per-episode ratings because no public API provides them. Instead, we correlate three data points:
          <br /><strong className="text-text-primary">1. Air date schedules.</strong>
          <br /><strong className="text-text-primary">2. Overall anime score averages tracked weekly.</strong>
          <br /><strong className="text-text-primary">3. Reviews posted within a 3-day window of the release.</strong>
          <br /><br />
          When we say "Episode 1 shows bombing activity," we mean: "A score anomaly occurred the week Episode 1 aired, and an unusual number of low-score reviews were posted during that window." This is potential correlation, not proof of causation.
        </p>
      </section>

      {/* Classifications */}
      <section className="space-y-6">
        <h3 className="text-lg font-black text-text-primary uppercase tracking-widest">2. Classifier Definitions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 border border-border rounded-xl bg-surface space-y-2">
            <h4 className="font-extrabold text-accent-gold text-sm uppercase">Rival Fandom Sabotage</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Triggered if a user gives a target show a 1/10 rating while their public favorites shelf explicitly lists verified rival anime.
            </p>
          </div>

          <div className="p-5 border border-border rounded-xl bg-surface space-y-2">
            <h4 className="font-extrabold text-accent-gold text-sm uppercase">Burner Accounts</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Triggered if a profile was created fewer than 30 days ago, has fewer than 2 entries total in their lists, and leaves extreme ratings.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
