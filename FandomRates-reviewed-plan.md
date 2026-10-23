# FandomRates: reviewed recovery and product plan

**Review date:** 2026-10-23  
**Repository:** `agenticweeb/fandomrates`  
**Status:** Planning and investigation complete; no repository files changed.

## The immediate diagnosis

The current GitHub Actions failure is a configuration-contract defect, not primarily an upstream scraping outage. The workflow maps `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, and `DB_PORT` from GitHub secrets, but it does not validate that those secrets exist. In the failed run, Actions injected empty values. `scraper.py` silently replaced several empty values with hard-coded Supabase host/user defaults, while the password remained empty, so `psycopg2` attempted PostgreSQL authentication with no password and failed.

There is also a documentation mismatch: `.env.example` and the README describe `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, while the scraper expects the five `DB_*` variables. The scraper also loads dotenv and imports production dependencies at module import time, so a missing package or local dotenv file can prevent a clean, actionable validation error.

The reliability incident is only the visible failure. The audit found that the current ingestion path can fabricate or misrepresent data: it derives Kitsu and MAL values from AniList when data is absent, synthesizes historical score variation, hard-codes episode vote counts, invents episode dates, fabricates profile statistics, treats failed responses as empty data, and has no atomic accepted-run boundary. The frontend also contains healthy-looking fallback values such as `8.20` and `8.10`, so an ingestion failure can look like a valid dashboard.

## First full plan shown for review

The first plan proposed these stages:

1. **Stop unsafe runs.** Add workflow preflight validation, remove hard-coded database defaults, require TLS, prevent overlapping runs, pin Actions, and rotate potentially exposed credentials.
2. **Make the database migration-led.** Add checked-in migrations, separate migration ownership from scraper DML, add schema checks, locks, transactions, and run status.
3. **Split ingestion into adapters, normalization, and persistence.** Use source-specific rate limiting, backoff, checkpoints, typed responses, and provider capability/terms metadata.
4. **Make data factual and idempotent.** Preserve source IDs, URLs, timestamps, payload hashes, score scales, source versions, immutable observations, and explicit missing/deleted states. Remove synthetic values and title-based matching.
5. **Implement anomaly semantics.** Compare accepted snapshots, version detector parameters, include uncertainty and alternatives, and distinguish unusual activity from manipulation.
6. **Redesign evidence and privacy.** Use stable source review IDs, avoid fabricated profile evidence, restrict raw identifiers, and separate aggregate analysis from identity inference.
7. **Add trust and safety.** Put submissions into private moderation, provide correction/appeal/takedown workflows, and prohibit calls to action, bulk exports, and dogpiling.
8. **Make the UI show provenance and failure.** Replace fallbacks with observed/calculated/signal/context/unavailable/stale states and show source, scale, timestamp, sample size, and uncertainty.
9. **Add tests, CI, and observability.** Test config, retries, malformed responses, transactions, idempotency, privacy, concurrency, UI error states, migration/RLS behavior, and source health.
10. **Scale only after source and product validation.** Add providers, episode data, multilingual analysis, and graph models only when terms, data quality, and trust gates are satisfied.

The first plan’s product premise was that FandomRates should be an evidence explorer rather than a fraud oracle: show how a score was formed, when it changed, where opinions split, and what the available data cannot establish.

## The three adversarial critiques

### Critique 1: SRE/backend review

The plan was directionally correct but not sufficiently executable. The most important corrections were:

- Validation must occur before production-capable imports, dotenv behavior, network access, database connections, or writes. Invalid configuration must prove zero side effects.
- The repository needs one exact credential contract. It must specify whether the scraper uses direct `DB_*` variables or a validated `DATABASE_URL`, TLS behavior, ownership, and rotation. The current Supabase URL/key documentation does not satisfy the scraper’s contract.
- Mutable Action tags should be replaced with immutable SHAs; permissions should be explicit; production secrets should live in a protected environment; workflow timeouts and non-overlapping leases are required.
- A migration baseline must be created from the deployed database, not assumed from the hand-written README SQL. The scraper must not perform runtime DDL.
- A run must publish through a staging/accepted-snapshot pointer. A successful database transaction alone does not prevent readers from seeing a partially ingested run.
- Source results must be tri-state or richer: `success`, `empty`, `unavailable`, and `malformed` are not interchangeable. Partial GraphQL data and incomplete pagination cannot be treated as authoritative.
- CI needs a real test architecture: pinned dependencies, fake HTTP/DB interfaces, migration/RLS integration tests, and a gate that fails when zero tests run.

### Critique 2: statistical and skeptical-fan review

The plan needed a sharper distinction between different claims. “Authenticity,” “bomber,” “glazer,” “bot,” “sockpuppet,” and “motive” are not interchangeable latent variables. Aggregate data can support an observational statement such as “an unusual coordinated pattern under this definition,” but cannot identify a person, intent, automation, or policy violation.

The critique required causal context and null tests around every alert. A premiere, finale, controversy, localization event, platform policy change, review prompt, or source outage can produce the same burst as manipulation. Multiple signals from the same event are correlated, not independent confirmation.

Recommended safeguards were lifecycle-matched baselines, change-point detection, score-distribution and participation measures, hierarchical or beta-binomial uncertainty for sparse cells, placebo windows, activity-preserving permutations, dependence-aware false-discovery control, title/time holdouts, and benign-event evaluation sets. The public UI should show effect size, sample size, coverage, interval, baseline, alternatives, and abstention—not a single “authenticity score.”

Cross-platform means are not automatically comparable. Platforms differ in scale, population, prompts, eligibility, moderation, rounding, and update delay. The MVP should keep source-native panels and avoid a blended or corrected score until measurement invariance is demonstrated.

### Critique 3: product, privacy, and growth review

The plan still contained too much product scope for an MVP. The strongest differentiated promise is not “find the bad fans.” It is: **Understand why anime ratings disagree.**

The first audience should be viewers, reviewers, and moderators investigating conflicting scores—not accused accounts. The core journey should be: search a canonical title, compare source-native observations, inspect provenance and missingness, share a timestamped evidence snapshot, or submit a private correction.

The critique removed or deferred public profile evidence, account investigation, episode promises without an approved source, leaderboards, comments, public report feeds, composite scores, and accusation-like labels. It emphasized that a neutral card can still cause harassment if it points users toward a target, so the product must avoid target navigation, bulk export, calls to action, and red/green verdict semantics.

The product should measure trust and understanding: whether users can identify the source and comparability of a score, search-to-understanding time, correction handling, freshness, and raw-identifier exposure. Page views and anomaly counts are poor success metrics.

## Final consolidated plan

### P0 — stop the bleeding and quarantine unsafe data

Modify `.github/workflows/scrape.yml` first:

- Set explicit permissions with `contents: read` and no unnecessary write permissions.
- Pin `actions/checkout` and `actions/setup-python` to immutable commit SHAs.
- Use a protected production environment with documented secret ownership.
- Add `concurrency` so scheduled and manual runs cannot overlap.
- Add `timeout-minutes` and restricted workflow-dispatch inputs.
- Add a redacted preflight that reports missing variable names, never values.
- Make failure status and summary explicit; do not upload raw logs by default.

Create a dependency-light configuration module, for example `scraper/config.py`. Run `validate_config()` as the first CLI action, before importing adapters or opening the network/database. Require nonblank `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, and a valid `DB_PORT`; require production TLS settings and reject unsupported modes. Choose one contract and document it everywhere: either direct pooler `DB_*` variables or a strictly validated `DATABASE_URL`. Do not maintain two undocumented contracts.

Remove hard-coded host/user defaults, DNS-to-IP replacement, password fallbacks, and implicit full-sync behavior. Permit dotenv only for explicit local mode; disable it in CI/production. Add tests proving every invalid-config case performs zero HTTP, database, DDL, or writes. Rotate credentials after reviewing historical Actions logs.

Before any new public write, back up the deployed database, record its schema fingerprint, and create a quarantine/cutover flag. Mark legacy synthetic or unknown rows untrusted and remove them from public views. Rollback must restore the backup or prior read pointer, never re-expose untrusted data.

### P1 — build a reliable data foundation

Add checked-in migrations under `supabase/migrations/`. Baseline against the deployed database, not only the README. Add migrations for source registry, canonical titles/seasons/episodes, source crosswalks, ingestion runs, run leases, staging observations, accepted observations, anomaly events, deletion records, and redacted public views.

Add constraints for source-native identity, valid score scale, nonnegative counts, UTC timestamps, platform/entity/score kind, foreign keys, and crosswalk cardinality. The migration owner gets DDL; the scraper role gets DML only. Add schema version/checksum and privilege/RLS preflight. The production scraper must never run `ALTER`, `DO`, or schema repair statements.

Refactor `scraper.py` into clear modules or equivalent boundaries: configuration, source clients, schemas, normalizers, repositories, quality checks, and orchestration. Use an ingestion state machine:

`planned → running (lease token) → publishing → succeeded | partial | failed`

Use a heartbeat, expiry, fencing token, and one global run lease. Write to run-scoped staging, validate completeness and quality, then atomically advance `accepted_run_id` or an equivalent current-snapshot pointer. Readers must query accepted runs only. Define crash recovery, replay, and bounded staging retention.

Each source adapter should declare its source/version, allowed operations, attribution and license class, retention/deletion behavior, quota signals, and authoritative/non-authoritative status. Return typed states such as `success`, `empty`, `unavailable`, and `malformed`. Validate JSON and GraphQL schemas; inspect AniList top-level GraphQL errors even on HTTP 200; do not persist partial data unless explicitly marked partial.

Use per-host concurrency and rate budgets, request/page/run ceilings, timeouts, User-Agent/contact information, circuit breakers, exponential backoff with jitter, valid `Retry-After` parsing, and dead-letter records. Stop on authentication/authorization failures rather than retrying blindly. Treat Jikan’s score `0` as missing when it means “no score.”

### P1 — make observations factual and idempotent

Every accepted observation should carry source, source-native ID, canonical URL where permitted, entity type, score/value, scale minimum/maximum, score kind, vote count, fetched time, source-updated time where available, run ID, source version, quality/license status, and a permitted payload hash or short-retention quarantine reference.

Use a crosswalk keyed by `(source, source_id)` with one active canonical target, season/part/special identity, effective dates, confidence, provenance, and manual-review state. Never fall back to title or slug matching. Quarantine mapping mismatches rather than failing an entire franchise or silently merging unrelated works.

Use source-native review IDs if reviews are ever approved. Do not deduplicate by username plus timestamp. Use immutable observation identity or observation hashes, preserve first-seen provenance, and separate immutable observations from current pointers. Only reconcile stale rows after a provider-specific completeness proof: all pages/cursors completed, valid schema, no parser failures, expected termination, and a complete source response. Otherwise retain prior accepted data and mark the run partial.

Remove all synthetic platform scores, invented history, hard-coded vote counts, fabricated profiles, invented dates, and episode score multiplication from production paths. If a source does not provide a field, store unavailable/null with a reason.

### P1 — tests, CI, and operational visibility

Add `pytest` or standardize on `unittest`, pin Python/npm dependencies, and make pure parser tests import without requiring a live database or production-only dependency. Add fake HTTP and fake DB adapters.

Minimum tests should cover configuration side effects, dotenv isolation, TLS/connection settings, retry and `Retry-After` behavior, malformed JSON, GraphQL errors, typed adapter results, rollback, lease fencing, crash points, exact upsert keys, duplicate pages, changed fields, mapping ambiguity, completeness-gated deletion, score/date/timezone validation, and source-failure no-write behavior.

Add `.github/workflows/ci.yml` for Python tests/lint/type checks, migration and RLS integration tests using a pinned disposable PostgreSQL/Supabase-compatible service, dependency/hash/SBOM/vulnerability checks, and Next lint/typecheck/build with dummy public variables and network disabled. Add a package test script and make CI fail if no tests are collected.

Emit structured redacted logs and metrics for run duration, lease state, per-source requests/status/429/403/5xx, retries, budget use, fetched/accepted/rejected rows, freshness, parser drift, staging/quarantine size, privacy events, and cost. Define SLOs, alert ownership, safe stop/re-run, dead-letter replay, and escalation. Zero rows must never count as success without an explicit, validated empty result.

### P2 — trustworthy analytics, initially internal/descriptive

Start with descriptive panels over genuinely observed snapshots. Separate these estimands:

- level and distribution shape;
- participation and volume;
- change over time;
- source disagreement;
- coordination signal.

Do not create one “authenticity score.” Use robust medians/trimmed means, quantiles, rating histograms, entropy or polarization measures, coverage, lifecycle/weekday-matched residuals, and uncertainty intervals. Pre-register feature definitions, thresholds, exclusions, confounders, and detector versions.

Use title/time holdouts, placebo windows, popularity/activity-preserving permutations, benign premiere/finale/controversy/platform-incident/outage benchmarks, and dependence-aware FDR. Suppress sparse or quasi-identifying cells. Every signal must include raw `n`, effective coverage, window, baseline, effect size, interval, detector/parameter hash, comparability status, and at least one plausible alternative explanation.

Anomaly events need an idempotent identity containing canonical entity, source, comparison window end, detector version, and parameter hash. Store run IDs, numerator/denominator, uncertainty, correction/retraction status, and explanation alternatives. Human review should be blinded where practical, conflict-aware, calibrated, and measured for agreement, reversals, appeals, abstention, and false positives.

The public product may eventually show a reviewed, aggregate “unusual change” annotation. It must not identify fans, infer motives, claim bots/sockpuppets, expose private linkage, or call a behavior a policy violation without privileged platform evidence and due process.

### P3 — MVP product and frontend

Reposition the product as **“Understand why ratings disagree.”** The MVP journey is:

1. Search/select a canonical anime.
2. Compare source-native score and vote cards.
3. See the scale, population caveat, collection time, and missingness.
4. Inspect a provenance drawer showing source, run, transformation, and quality status.
5. Open a distribution or observed timeline when enough permitted data exists.
6. Share a timestamped evidence snapshot or submit a private correction.

Use a compact vocabulary:

- **Observed:** directly returned by a source.
- **Calculated:** reproducible arithmetic over observed data.
- **Signal:** a statistical pattern, not proof.
- **Context:** a dated linked event.
- **Unavailable:** no permitted or reliable value.
- **Stale:** outside the freshness target.
- **Not comparable:** source estimands differ.

Update `app/page.tsx`, battle/title routes, `app/methodology/page.tsx`, `lib/supabase.ts`, `types/index.ts`, and relevant components including `DashboardContainer.tsx`, `ScoreChart.tsx`, `RatingDistributionChart.tsx`, `DataFreshnessBadge.tsx`, `ProfileEvidence.tsx`, `EpisodeGrid.tsx`, and `EpisodeDetail.tsx`.

Remove “Truth,” automatic bomber/glazer labels, hard-coded scores, fabricated charts, unsupported episode timelines, and healthy green fallbacks. Implement typed loading, empty, stale, unavailable, partial, and error states. Every displayed number must trace to a source observation or documented calculation. Use accessible semantics rather than red/green verdicts. Avoid target search, anomaly leaderboards, comments, bulk export, and calls to action.

Public raw reviews, usernames, platform IDs, reporter details, and suspicious-profile tables must not be selectable anonymously. Use restricted raw stores and explicit redacted views. Avoid surrogate IDs when timing or rare behavior could re-identify a person.

### P4 — scale only after gates pass

Use three release gates:

- **Gate 1:** P0/P1 reliability is green, invalid config has zero side effects, leases prevent overlap, schema/RLS matches, synthetic rows are quarantined, and rollback is rehearsed.
- **Gate 2:** one terms-cleared source produces factual idempotent snapshots; outages and partial states are visible; crosswalks are manually verified; parser drift is alertable; 95% of successful pages meet the published freshness target.
- **Gate 3:** only after user pilot results, source/legal approval, a labeled evaluation benchmark, and trust/safety review may a second source or public aggregate unusual-change annotation be enabled.

Pilot outcomes should include: 100% traceability of displayed numbers, zero fabricated production rows, 90% of testers correctly identifying score source and comparability, median search-to-understanding under 90 seconds, correction acknowledgement within two business days, and zero raw-identifier exposure.

Add episode data only when a permitted source actually provides episode observations. Add multilingual text clustering, graph/null models, alerts, and additional providers only with a written source-acceptance checklist covering permissions, retention, redistribution, quotas, deletion, attribution, and terms.

## Final recommendation

Proceed, but do not proceed with the current “who is downrating whom?” framing as a public person-finding product. The defensible opportunity is a provenance-first anime rating evidence explorer that exposes disagreement, timing, distributions, coverage, and uncertainty. Account-level claims should remain out of the MVP and, if ever considered, require a separate privacy, legal, moderation, and platform-evidence program.

The first implementation should be the small P0 patch and quarantine work, not a broad rewrite: fail closed on configuration, fix the Actions contract, rotate credentials, stop synthetic writes, add a cutover flag, and make the next failed run explain itself without leaking secrets. Only after that should the repository move toward migrations, accepted snapshots, source adapters, and the transparent comparison UI.

## Key references

[1]: https://docs.anilist.co/guide/rate-limiting "AniList rate limiting"
[2]: https://docs.anilist.co/guide/terms-of-use "AniList terms of use"
[3]: https://myanimelist.net/static/apiagreement.html "MyAnimeList API agreement"
[4]: https://docs.api.jikan.moe/ "Jikan API documentation"
[5]: https://hummingbird-me.github.io/api-docs/ "Kitsu API documentation"
[6]: https://pmc.ncbi.nlm.nih.gov/articles/PMC9728858/ "Confounds and overestimations in fake review detection"
[7]: https://pmc.ncbi.nlm.nih.gov/articles/PMC8020490/ "Causal inference with observational data"
[8]: https://pmc.ncbi.nlm.nih.gov/articles/PMC5464762/ "Survey of time-series change-point detection"
[9]: https://btrantruong.github.io/assets/pdf/uncover.pdf "Uncovering coordinated networks on social media"
[10]: https://www.nist.gov/privacy-framework "NIST Privacy Framework"
[11]: https://www.law.cornell.edu/wex/defamation "Cornell Legal Information Institute: defamation"
[12]: https://www.cisa.gov/vulnerability-disclosure-policy-template "CISA vulnerability disclosure policy template"
[13]: https://www.animenewsnetwork.com/encyclopedia/ratings-anime.php "Anime News Network ratings"
[14]: https://help.imdb.com/article/imdb/track-movies-tv/weighted-average-ratings/GWT2DSBYVT2F25SK "IMDb weighted average ratings"
[15]: https://store.steampowered.com/news/app/593110/view/1808664240902926994 "Steam review bombing timeline approach"

Repository evidence reviewed: `/home/ubuntu/fandomrates/scraper.py`, `.github/workflows/scrape.yml`, `tests/test_scraper_episode_logic.py`, `requirements.txt`, `package.json`, `.env.example`, `README.md`, `lib/supabase.ts`, `types/index.ts`, the `app/` routes, and the relevant `components/` files.
