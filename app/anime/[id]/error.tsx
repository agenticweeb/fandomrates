'use client';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="mx-auto max-w-2xl rounded-2xl border border-danger/30 bg-surface p-8 text-center"><h1 className="text-2xl font-black text-text-primary">This evidence page is temporarily unavailable</h1><p className="mt-3 text-sm leading-6 text-text-secondary">The source data could not be loaded. Try again; an unavailable source is not the same as a zero rating.</p><button onClick={() => reset()} className="mt-6 rounded-xl bg-text-primary px-5 py-3 text-sm font-black text-background">Try again</button></main>;
}
