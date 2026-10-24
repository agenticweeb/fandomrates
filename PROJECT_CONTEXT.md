

## 2026-10-24 Search and Evidence Resilience Audit

### User-reported production behavior

The homepage showed `0 matching titles` for `Lord of mysteries` and also reported `Comparison score history is temporarily unavailable`. This was investigated against the deployed code, scraper, workflows, schema documentation, and three independent audits (data/search reliability, anime-fan UX, and adversarial trust/product review).

### Confirmed causes

1. The public homepage searches only the local `anime` table. It does not query AniList, Jikan, Kitsu, aliases, native titles, or source IDs on demand.
2. Catalog discovery is popularity-page based. The routine workflow ingests AniList page 1 and the bounded backfill ingests pages 2–10, at most roughly 500 titles. There is no full-catalog cursor or title-alias table. A title outside that bounded set legitimately returns zero even when AniList knows it.
3. The comparison query selected nested `anime_a`/`anime_b` objects but omitted the scalar `anime_a_id` and `anime_b_id` fields. The subsequent score-history query therefore built an invalid/undefined ID filter, producing the screenshot's comparison-history warning.
4. The repository has no tracked SQL migration directory. The README is the only schema source, while runtime code also depends on `seasons`, `episodes`, and `reviews`; this creates production schema/RLS drift risk.
5. The earlier homepage error boundary treated optional score, comparison, and anomaly queries as fatal. That behavior was fixed in PR #3, but the remaining warning exposed the comparison ID bug.

### Implemented in the current follow-up work

- Added `anime_a_id` and `anime_b_id` to the homepage battle query.
- Added a public, bounded AniList source-search route at `/api/catalog-search` for zero-local-result recovery. It returns source-native title, score, popularity, cover, source ID, and source URL; it does not pretend that a live source result is already a FandomRates evidence page.
- Updated the explorer to distinguish `Not indexed in FandomRates yet` from `No source match found`, show a live source match when available, link to the source, and offer a request-index path.
- Updated the hero copy and search placeholder to communicate the decision/evidence purpose more directly.
- Local evidence remains authoritative for FandomRates pages; the fallback is discovery-only until canonical identity and ingestion are established.

### Required next data-foundation work

- Add tracked Supabase migrations and explicit public aggregate/source-native views/policies.
- Add canonical title aliases/native titles/source IDs and normalized search fields.
- Add a durable catalog cursor instead of hard-coded pages 1–10.
- Add an idempotent source-search-to-index workflow with rate limits and audit records.
- Add source-health, freshness, empty, stale, partial, and unavailable states as typed contracts.
- Remove or quarantine legacy review/profile/accusation surfaces and keep the public product limited to aggregate, provenance-backed evidence.

### Validation for this follow-up

- Python syntax and 6 regression tests pass.
- TypeScript typecheck passes.
- ESLint passes with existing non-blocking raw-image warnings.
- Production Next.js build passes, including `/api/catalog-search`.
- `git diff --check` passes.
