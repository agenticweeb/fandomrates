import React from 'react';
import Link from 'next/link';

export default function MethodologyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 py-12">
      <div className="space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-text-primary">System Architecture & Detection Heuristics</h1>
        <p className="text-base text-text-secondary">
          FandomRates operates on open-source audit parameters. We believe the story of an anime’s scores shouldn't be mystery code—here is exactly how we parse and evaluate scores.
        </p>
      </div>

      <section className="space-y-4 border-l-2 border-accent-gold pl-6">
        <h3 className="text-lg font-bold text-text-primary">1. Relational Integrity Rules</h3>
        <p className="text-sm text-text-secondary leading-relaxed">
          The database tracks scores daily across three platform networks. An <strong>Anomaly Event</strong> is triggered programmatically if the score of any title shifts by <strong>±0.30 absolute points</strong> between snapshot checks.
        </p>
      </section>

      <section className="space-y-6">
        <h3 className="text-lg font-bold text-text-primary">2. Classification Algorithms</h3>
        <p className="text-sm text-text-secondary leading-relaxed">
          Once an anomaly is flagged, the crawler indexes recent user review profiles and maps their public characteristics to these categories:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 border border-border rounded-xl bg-surface space-y-2">
            <h4 className="font-bold text-accent-gold text-sm">Rival Fandom Sabotage</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Triggered if a user gives a target show a <strong>1/10 or 2/10 rating</strong> while their public favorites shelf explicitly lists verified rival anime (e.g. Favoring Re:Zero while bombing Mushoku).
            </p>
          </div>

          <div className="p-5 border border-border rounded-xl bg-surface space-y-2">
            <h4 className="font-bold text-accent-gold text-sm">Burner Accounts</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Triggered if a profile was created <strong>fewer than 30 days ago</strong>, has <strong>fewer than 2 entries</strong> total in their lists, and leaves extreme ratings.
            </p>
          </div>

          <div className="p-5 border border-border rounded-xl bg-surface space-y-2">
            <h4 className="font-bold text-accent-gold text-sm">Rating Inflation</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Triggered if a profile awards a <strong>9/10 or 10/10 rating</strong> to a target show while having <strong>fewer than 3 titles</strong> in their completed library.
            </p>
          </div>

          <div className="p-5 border border-border rounded-xl bg-surface space-y-2">
            <h4 className="font-bold text-accent-gold text-sm">Verified Audits</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              User profiles submitted via the community form are checked against IP logs and duplicate patterns before classification updates.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-bold text-text-primary">3. System Limitations</h3>
        <p className="text-sm text-text-secondary leading-relaxed">
          Due to privacy constraints and API policies, we do not crawl internal private user lists, IP addresses, or cookie fingerprints. Calculations are based solely on public-facing user profiles, favorites lists, and dates [7.3].
        </p>
      </section>

      <section className="p-6 border border-border rounded-2xl bg-surface-elevated/40 space-y-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h4 className="font-bold text-text-primary text-sm">Audit Data Transparency</h4>
          <p className="text-xs text-text-secondary mt-1">Want to build your own analytics parser? Access and inspect our database snapshots.</p>
        </div>
        <Link 
          href="/" 
          className="px-4 py-2 text-xs font-bold bg-background text-text-primary border border-border rounded-lg hover:border-text-secondary/40 transition-all text-center"
        >
          Inspect API
        </Link>
      </section>
    </div>
  );
}
