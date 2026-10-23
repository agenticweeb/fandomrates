'use client';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="mx-auto max-w-2xl rounded-2xl border border-danger/30 bg-surface p-8 text-center"><h1 className="text-2xl font-black text-text-primary">Evidence is temporarily unavailable</h1><p className="mt-3 text-sm leading-6 text-text-secondary">The catalog or score source could not be reached. This is different from having no matching anime. Try again without losing your search.</p><button onClick={() => reset()} className="mt-6 rounded-xl bg-text-primary px-5 py-3 text-sm font-black text-background">Try again</button></main>;
}
