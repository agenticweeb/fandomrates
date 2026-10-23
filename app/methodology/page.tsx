import Link from 'next/link';

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-12 py-12">
      <header className="space-y-4">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-accent-cyan">How FandomRates works</p>
        <h1 className="text-4xl font-black tracking-tight text-text-primary md:text-5xl">Evidence before verdicts.</h1>
        <p className="max-w-3xl text-base leading-7 text-text-secondary">FandomRates is a source-transparency tool for understanding why anime ratings disagree. We preserve the source, time, scale, coverage, and limitations instead of manufacturing a single “real” score.</p>
      </header>
      <section className="grid gap-4 md:grid-cols-2" aria-labelledby="states-heading">
        <h2 id="states-heading" className="sr-only">Data states</h2>
        {[
          ['Observed', 'Returned directly by a named source during the displayed collection window.'],
          ['Calculated', 'Reproducible arithmetic over observed values, with the inputs and formula disclosed.'],
          ['Signal', 'A statistical pattern that deserves inspection. It is not proof of intent or identity.'],
          ['Unavailable', 'The source did not provide a permitted or reliable value. Unavailable is not zero.'],
          ['Stale', 'The last accepted observation is older than the published freshness target.'],
          ['Not comparable', 'Two values differ in scale, population, eligibility, timing, or meaning.'],
        ].map(([label, description]) => (
          <article key={label} className="rounded-2xl border border-border bg-surface p-5">
            <h3 className="font-black text-text-primary">{label}</h3>
            <p className="mt-2 text-sm leading-6 text-text-secondary">{description}</p>
          </article>
        ))}
      </section>
      <section className="space-y-5 rounded-2xl border border-border bg-surface p-6 md:p-8">
        <h2 className="text-2xl font-black text-text-primary">What a source-native rating means</h2>
        <p className="text-sm leading-7 text-text-secondary">Each rating card should identify the platform, its native scale, the available count or popularity measure, the observation timestamp, and the collection run. Platforms may use different populations, prompts, moderation, rounding, and update schedules, so FandomRates keeps their values separate.</p>
        <p className="text-sm leading-7 text-text-secondary">A time-series change can be useful context, but a change can also reflect a premiere, finale, controversy, policy update, source outage, or delayed cache. We show alternatives and uncertainty before describing a pattern as unusual.</p>
      </section>
      <section className="space-y-5 rounded-2xl border border-border bg-surface p-6 md:p-8">
        <h2 className="text-2xl font-black text-text-primary">What we do not claim</h2>
        <ul className="space-y-3 text-sm leading-7 text-text-secondary">
          <li>We do not identify individual fans, infer motives, or label people as bots, sockpuppets, “bombers,” or “glazers.”</li>
          <li>We do not treat a score spike, extreme rating, shared language, or new account as proof of manipulation.</li>
          <li>We do not estimate missing scores, invent historical observations, or silently blend incompatible platforms.</li>
          <li>We do not publish raw usernames, platform IDs, private messages, or target lists through the public product.</li>
        </ul>
      </section>
      <section className="space-y-5 rounded-2xl border border-border bg-background/50 p-6 md:p-8">
        <h2 className="text-2xl font-black text-text-primary">Source and retention limits</h2>
        <p className="text-sm leading-7 text-text-secondary">API access is not automatically permission to build a public mirror. Before enabling a source, we verify its endpoint rules, rate limits, attribution, storage and redistribution rights, deletion behavior, commercial terms, and user-data restrictions. If a source is unavailable or its permission is unclear, the interface says so.</p>
        <p className="text-sm leading-7 text-text-secondary">Historical charts begin with accepted observations collected by FandomRates. We do not backfill history by varying a current score or copying a value from another platform.</p>
      </section>
      <section className="flex flex-col gap-4 rounded-2xl border border-accent-cyan/30 bg-accent-cyan/5 p-6 md:flex-row md:items-center md:justify-between">
        <div><h2 className="font-black text-text-primary">Found a data problem?</h2><p className="mt-1 text-sm text-text-secondary">Send a private correction request with the source link and context. Reports are leads for review, not public accusations.</p></div>
        <Link href="/submit" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-text-primary px-5 py-3 text-xs font-black uppercase tracking-wider text-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-cyan">Request correction</Link>
      </section>
    </div>
  );
}
