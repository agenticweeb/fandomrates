

## 2026-10-24 AniList-first foundation tranche

The research workflow completed six independent tracks covering AniList, Jikan/MAL/Kitsu/open datasets, Postgres/Supabase search, reliable ingestion, anime-fan product differentiation, and free GitHub-native tools. The consolidated decision is to use AniList as a first-class interactive resolver and identity source while avoiding an uncontrolled full mirror. AniList search, aliases, IDs, source links, and current observations are useful; AniList terms, rate limits, non-unique titles, and anti-hoarding restrictions are product constraints.

The repository now contains `supabase/migrations/20261024180000_anime_identity_search.sql`. It adds maintained normalized title keys, `anime_title_aliases`, `source_identities`, trigram indexes, RLS-safe public read policies, and a bounded SECURITY INVOKER `search_anime_titles` RPC. It also revokes anonymous reads from legacy profile/submission tables. This migration must be applied through the Supabase CLI migration workflow before the scraper can persist aliases.

The scraper now requests AniList native titles, synonyms, `idMal`, `updatedAt`, and `siteUrl`. When the migration exists, discovery upserts accepted AniList source identities and controlled aliases with provenance. If the migration has not yet been applied, catalog rows are retained and an actionable warning is emitted rather than silently losing the catalog row. A deterministic Unicode/case/punctuation normalizer and regression tests were added.

The research report is saved at `FandomRates-AniList-first-research-and-roadmap-2026-10-24.md`. It records provider terms, free-tier safeguards, the identity/crosswalk model, ingestion checkpoint design, product differentiation, rejected shortcuts, and the staged 30/60/90-day roadmap.
