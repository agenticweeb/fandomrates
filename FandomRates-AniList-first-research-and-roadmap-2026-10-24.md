# FandomRates: AniList-first discovery and evidence roadmap

## Decision

FandomRates should use AniList as a first-class interactive discovery and identity source. It should not become an uncontrolled AniList mirror. The product needs two layers: a local, searchable identity index that can answer common title queries quickly, and bounded provider lookups that resolve titles, aliases, IDs, and current source observations when the local index is incomplete.

The immediate failure came from using a popularity slice as if it were an all-anime catalog. A robust product should not make users know whether a title happens to rank in the first 500 entries. A title search should resolve against canonical titles, native titles, synonyms, source IDs, and controlled aliases. If a title is discovered live but has not yet been accepted into the FandomRates evidence catalog, the UI must say exactly that.

## What AniList provides

AniList offers a public GraphQL API for anime discovery without requiring an API credential for basic public queries. Its Media records expose an AniList ID, optional MyAnimeList ID, English, romaji, and native titles, synonyms, relations, current score fields, popularity, status, and update metadata. The API supports search and pagination, but title results are not guaranteed to be unique; FandomRates must show disambiguation rather than silently selecting the first result.

AniList pagination must stop using `PageInfo.hasNextPage`, not total or lastPage. The official rate-limit documentation describes a nominal limit of 90 requests per minute and warns that degraded service may reduce that to 30. Requests must inspect headers, honor Retry-After, back off on 429/403/5xx responses, and avoid burst fan-out.

AniList terms are a product constraint. FandomRates should avoid a full durable mirror, raw payload hoarding, private/user-profile ingestion, or positioning as a replacement list/tracker. Use narrow user-triggered discovery, a controlled identity/alias index, source links, and only the observations needed for the evidence product. Request written guidance before commercial expansion or a scope that could be viewed as a competing service.

## Free complementary sources

The official MyAnimeList API is preferable to page scraping when a client ID and approved use are available. Jikan is useful as a throttled read-only fallback, but it is unofficial and scraper-backed; its documented hosted limits are 3 requests per second and 60 per minute with caching and ETag support. Kitsu can provide another current aggregate and identity perspective, but its catalog visibility and undocumented public quota require conservative handling. Manami's anime-offline-database can seed a broad local identity/alias index under ODbL obligations, while Wikidata structured data can contribute CC0 identifiers and alternate names. These sources must be kept in provider-specific adapters and never silently treated as interchangeable truth.

No checked provider offers a provider-native historical score timeline. FandomRates must create its own append-only observations from permitted current aggregates, recording source, source ID, native scale, observed time, provider update time when available, payload hash, parser version, and availability state. A repeated unchanged fetch is a check attempt, not automatically a new meaningful score change.

## Search architecture

The current `anime` table can be extended without forcing an immediate destructive rewrite. Add a controlled `anime_title_aliases` table and a `source_identities` crosswalk. Each alias should retain language, alias type, source, source ID, observation time, and provenance. A source ID is scoped to its provider; it must never become the global canonical key.

For Postgres/Supabase, enable `pg_trgm` and `unaccent`. Maintain plain normalized text columns rather than assuming `unaccent` is immutable enough for a generated column. Use exact normalized equality first, then prefix/full-text candidates, then trigram similarity. Add bounded `search_anime_titles` RPC output containing the matched alias, source, and ambiguity count. The public function should be SECURITY INVOKER and read-only; scraper writes remain server-side.

Search ranking should favor an exact canonical or alias match, then a prefix, then a fuzzy match. Popularity may be a tiny deterministic tie-breaker, never the primary relevance signal. Short queries need special handling, and ambiguous sequels, remakes, specials, and split cours must remain visible as multiple candidates.

## Reliable ingestion

GitHub Actions is useful for public-repository schedules, but it is not an ingestion SLA: schedules can be delayed or dropped, public schedules can be disabled after long inactivity, and runner-local files are not durable. Use scheduled and manual dispatch, a concurrency group, a database run ledger, bounded per-run request/time budgets, and a durable checkpoint.

Each provider adapter should enumerate, fetch, normalize, validate, and classify errors. A page should be committed with its checkpoint in one transaction. A staging run should be validated for required IDs, nullable/type/range invariants, duplicate rate, pagination completion, and minimum coverage before it is promoted. Partial or schema-drifted runs must never replace the public accepted view.

Use one bounded worker per provider, exponential backoff, provider-specific circuit breakers, and a dead-letter queue for poison pages or records. Rotate deterministic shards rather than attempting a giant nightly crawl. Prioritize tracked titles, airing titles, newly discovered records, and stale evidence. Store authoritative run state in Supabase/Postgres, not Actions cache or artifacts.

## Product that earns a return visit

FandomRates should not compete by showing the same number in another card. The differentiator is an evidence-backed decision layer. A title page should combine identity and aliases, commitment cost, status and relations, source-native scores, source scale, coverage, freshness, current-versus-previous observations, and a provenance drawer.

A compare mode should handle two to four user-selected titles rather than only fixed battle rooms. It should show trade-offs such as commitment, completion/status, relation/order, coverage, freshness, and source spread without inventing a blended truth score. A private local decision log should preserve the evidence state at the time of choice, allow an outcome, and later produce a neutral “what changed since you saved this” brief.

The ethical trust layer should show source health, accepted observations, stale/partial/unavailable states, cross-source identity confidence, and correction status. It should not label users as bombers, inflators, fake fans, bots, or genuine voters. Aggregate unusual-change research can be considered later, but only as a neutral, uncertainty-aware signal with a declared baseline and abstention rules.

## Implementation sequence

**First tranche:** add migrations for aliases, source identities, normalized search, source observations, ingestion runs, and checkpoints; create the read-only search RPC; extract an AniList provider boundary with typed validation and rate-limit handling; extend AniList fields to include native titles and synonyms; add search contract tests; and update the homepage to report matched alias and source provenance.

**Second tranche:** add a bounded identity resolver that can accept a live AniList result, show ambiguity, and create an explicit index request. Add a server-only acceptance job that upserts the selected identity and aliases after validation. Add source-native score observations and freshness states to the title page.

**Third tranche:** move ingestion to run-scoped staging and accepted-run promotion. Add durable pagination/checkpoints, provider health, dead letters, replay, and a rotating all-catalog strategy. Seed broad identity coverage from a pinned, license-reviewed dataset where appropriate rather than mirroring all provider payloads.

**Fourth tranche:** build user-selected compare mode, evidence receipts, saved snapshots, change briefs, optional notifications, correction review, and outcome calibration. Add instrumentation for search success, zero-result recovery, result-to-detail conversion, save rate, compare use, and comprehension of source versus calculation.

## Explicitly rejected shortcuts

Do not solve coverage by simply increasing the popularity page loop until it becomes a giant AniList mirror. Do not use Jikan as an official MAL substitute. Do not scrape anime sites or user profiles because their pages are public. Do not rank or accuse voters. Do not combine source scores into a “true” score. Do not put Supabase service keys or provider credentials in the browser. Do not make a full crawler depend on GitHub schedule timing without a durable lease and heartbeat.

## Sources

- [1] AniList GraphQL guide and Media search: https://docs.anilist.co/guide/graphql/queries/media
- [2] AniList pagination: https://docs.anilist.co/guide/graphql/pagination
- [3] AniList rate limits: https://docs.anilist.co/guide/rate-limiting
- [4] AniList terms of use: https://docs.anilist.co/guide/terms-of-use
- [5] MyAnimeList API reference: https://myanimelist.net/apiconfig/references/api/v2
- [6] Jikan API documentation: https://docs.api.jikan.moe/
- [7] Kitsu API documentation: https://kitsu.docs.apiary.io/
- [8] Manami anime offline database: https://github.com/manami-project/anime-offline-database
- [9] Wikidata licensing: https://www.wikidata.org/wiki/Wikidata:Licensing
- [10] PostgreSQL trigram search: https://www.postgresql.org/docs/current/pgtrgm.html
- [11] Supabase database migrations: https://supabase.com/docs/guides/deployment/database-migrations
- [12] GitHub Actions schedule behavior and limits: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
