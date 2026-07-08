"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function MethodologyPage() {
  const [loading, setLoading] = useState<string | null>(null);

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
        <p className="text-base text-text-secondary leading-relaxed font-semibold">
          We show our work. Download the raw data, check our math, tell us where we're wrong. That's the point.
        </p>
      </div>

      {/* CSV/JSON Download Card */}
      <section className="p-6 border border-border rounded-2xl bg-surface space-y-6">
        <div>
          <h3 className="text-lg font-black text-text-primary uppercase tracking-wider">Don't trust us? Good.</h3>
          <p className="text-xs text-text-secondary mt-1">
            Download everything. CSV. JSON. Whatever you need. No account, no gatekeeping.
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
                Score History (CSV)
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
                Flagged Users (CSV)
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
                Anomaly Events (CSV)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Technical definitions explained */}
      <section className="space-y-4 border-l-2 border-accent-gold pl-6">
        <h3 className="text-lg font-black text-text-primary uppercase tracking-widest">1. We show you the pattern. You decide what it means.</h3>
        <p className="text-sm text-text-secondary leading-relaxed">
          We can't see who rated what episode. No API gives us that. What we CAN see: when the score moved, and what reviews showed up right after. It's not proof — it's a pattern. You decide what it means.
          <br /><br />
          When we flag an episode, we're saying: "Something happened here." Maybe it's a bad episode. Maybe it's a campaign. We show you the when, the who, and the what. The why is yours to figure out.
        </p>
      </section>

      {/* Classifications */}
      <section className="space-y-6">
        <h3 className="text-lg font-black text-text-primary uppercase tracking-widest">2. Classifier Definitions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 border border-border rounded-xl bg-surface space-y-2">
            <h4 className="font-extrabold text-accent-gold text-sm uppercase">Rival Fan Hit</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Gave it a 1/10. Their favorites list is basically a shrine to the other show. Draw your own conclusions.
            </p>
          </div>

          <div className="p-5 border border-border rounded-xl bg-surface space-y-2">
            <h4 className="font-extrabold text-accent-gold text-sm uppercase">Fresh Accounts</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Account made last week. Rated one show: this one. Gave it a 1/10 or a 10/10. Nothing else on their list. Suspicious? You tell us.
            </p>
          </div>

          <div className="p-5 border border-border rounded-xl bg-surface space-y-2">
            <h4 className="font-extrabold text-accent-gold text-sm uppercase">The Extremist</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Only gives 1s and 10s. No nuance, no middle ground. Either everything is trash or everything is a masterpiece.
            </p>
          </div>

          <div className="p-5 border border-border rounded-xl bg-surface space-y-2">
            <h4 className="font-extrabold text-accent-gold text-sm uppercase">The Stan</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Gave it a 10/10. Their list has 3 shows total. All 10s. All from the same franchise. Not a critic — a cheerleader.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
