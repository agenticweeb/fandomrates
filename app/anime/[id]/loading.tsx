export default function Loading() {
  return <div className="space-y-6" aria-busy="true"><div className="h-64 animate-pulse rounded-3xl border border-border bg-surface" /><div className="h-48 animate-pulse rounded-2xl border border-border bg-surface" /><p className="text-sm text-text-secondary">Loading source-backed evidence…</p></div>;
}
