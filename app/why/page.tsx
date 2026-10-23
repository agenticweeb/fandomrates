import Link from 'next/link';

export const metadata = {
  title: 'Why FandomRates exists',
  description: 'Why FandomRates adds decision context instead of replacing anime rating sources.',
};

export default function WhyPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 py-8">
      <header className="rounded-3xl border border-accent-cyan/30 bg-gradient-to-br from-accent-cyan/10 via-surface to-surface p-6 md:p-10">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-accent-cyan">The product thesis</p>
        <h1 className="mt-3 max-w-4xl text-3xl font-black leading-tight text-text-primary md:text-5xl">The source tells you its score. FandomRates helps you decide what to do with it.</h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-text-secondary">You should not leave AniList, MyAnimeList, Kitsu, or IMDb just to see the same number in a darker interface. FandomRates exists for the questions those pages do not answer together: why do the sources disagree, how old is each observation, what trade-off fits my situation, and did my last decision actually work for me?</p>
      </header>

      <section className="grid gap-4 md:grid-cols-3" aria-label="FandomRates value proposition">
        {[
          ['Explain disagreement', 'Keep each source visible, then show spread, sample context, freshness, and the limits of comparing different communities.'],
          ['Make a decision', 'Choose a lower-disagreement lens, short commitment, or wildcard and receive a brief that exposes trade-offs rather than pretending to predict your enjoyment.'],
          ['Keep a record', 'Save the decision locally, later mark watched or dropped, and review what happened. The current pilot does not yet train a personal model.'],
        ].map(([title, copy]) => <article key={title} className="rounded-2xl border border-border bg-surface p-5"><h2 className="text-lg font-black text-text-primary">{title}</h2><p className="mt-3 text-sm leading-6 text-text-secondary">{copy}</p></article>)}
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6 md:p-8">
        <h2 className="text-2xl font-black text-text-primary">What this is not</h2>
        <div className="mt-4 grid gap-4 text-sm leading-6 text-text-secondary md:grid-cols-2"><p><strong className="text-text-primary">Not a replacement tracker.</strong> Keep using the service where your list, friends, and history already live. FandomRates is a decision and evidence layer.</p><p><strong className="text-text-primary">Not a fake-fan detector.</strong> A burst or unusual distribution can have many explanations. We show signals and uncertainty, never public accusations about people.</p><p><strong className="text-text-primary">Not a universal score.</strong> A source score is a measurement of that source&apos;s population and method. We do not blend incompatible populations into a made-up truth.</p><p><strong className="text-text-primary">Not an engagement trap.</strong> The device-local decision log is optional, exportable, deletable, and designed to save time rather than create compulsive browsing.</p></div>
      </section>

      <section className="rounded-2xl border border-border bg-background/50 p-6 md:p-8"><h2 className="text-2xl font-black text-text-primary">The promise</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-text-secondary">Every recommendation-like statement must separate observed source data from interpretation. Every important number should have a source and observation time. When the evidence is thin, stale, or conflicting, the product should say so. If FandomRates cannot help you choose, it has failed its job.</p><Link href="/" className="mt-5 inline-flex rounded-xl bg-text-primary px-5 py-3 text-sm font-black text-background">Try a decision brief</Link></section>
    </div>
  );
}
