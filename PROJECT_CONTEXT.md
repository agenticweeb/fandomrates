

## 2026-10-24 AniList-first foundation tranche

The research workflow completed six independent tracks covering AniList, Jikan/MAL/Kitsu/open datasets, Postgres/Supabase search, reliable ingestion, anime-fan product differentiation, and free GitHub-native tools. The consolidated decision is to use AniList as a first-class interactive resolver and identity source while avoiding an uncontrolled full mirror. AniList search, aliases, IDs, source links, and current observations are useful; AniList terms, rate limits, non-unique titles, and anti-hoarding restrictions are product constraints.

The repository now contains `supabase/migrations/20261024180000_anime_identity_search.sql`. It adds maintained normalized title keys, `anime_title_aliases`, `source_identities`, trigram indexes, RLS-safe public read policies, and a bounded SECURITY INVOKER `search_anime_titles` RPC. It also revokes anonymous reads from legacy profile/submission tables. This migration must be applied through the Supabase CLI migration workflow before the scraper can persist aliases.

The scraper now requests AniList native titles, synonyms, `idMal`, `updatedAt`, and `siteUrl`. When the migration exists, discovery upserts accepted AniList source identities and controlled aliases with provenance. If the migration has not yet been applied, catalog rows are retained and an actionable warning is emitted rather than silently losing the catalog row. A deterministic Unicode/case/punctuation normalizer and regression tests were added.

The research report is saved at `FandomRates-AniList-first-research-and-roadmap-2026-10-24.md`. It records provider terms, free-tier safeguards, the identity/crosswalk model, ingestion checkpoint design, product differentiation, rejected shortcuts, and the staged 30/60/90-day roadmap.

## 2026-10-25 indexing and evidence-receipt tranche

The live AniList result path is no longer a dead display-only flow. `supabase/migrations/20261025190000_index_requests.sql` adds an idempotent `index_requests` queue and a restricted `enqueue_index_request` RPC. `app/api/index-requests/route.ts` verifies the supplied AniList ID server-side before enqueueing it. The homepage carries the provider ID, shows already-indexed results as direct evidence links, and sends non-indexed results to the indexing form with structured context.

`.github/workflows/index-requests.yml` runs a bounded queue worker every 15 minutes and supports manual dispatch. `scraper.py --process-index-requests` leases requests, fetches the verified AniList record, upserts its source identity/aliases and current AniList observation, then attempts explicit MAL/Jikan and Kitsu enrichment when an AniList MAL mapping exists. Requests retry with a bounded backoff and become failed after repeated errors. A new-row INSERT placeholder mismatch in catalog sync was fixed, and AniList `idMal` is now persisted.

The anime detail page was rebuilt as an evidence receipt. It now shows observed source count, calculated spread, freshness, source-native cards, source links when IDs exist, identity aliases, missingness language, and a section explaining why FandomRates exists alongside the original rating platforms. It deliberately does not manufacture a blended score, infer community intent, or call missing observations zero.
