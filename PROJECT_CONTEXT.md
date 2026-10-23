```markdown
# DEEP SYSTEM STATE SERIALIZATION: FANDOMRATES
> SYSTEM TIMESTAMP: 2026-10-23T16:45:00+03:00
> ENGINE VERSION: 3.0-PRECISE
> HASH CURRENT STATE: cd4a161
> SERIALIZATION STATUS: feature branch PR #2 open; hostile-review hardening committed and remote checks passed

---

## 1. EXTENDED PROJECT OVERVIEW & SCOPE BOUNDARIES

### Core product vision

FandomRates is an evidence-first anime decision layer, not a competing tracker, universal leaderboard, rating mirror, or fake-voter detector. Existing sources already provide catalogs, lists, reviews, recommendations, social features, episode progress, and source-native scores. FandomRates exists to answer the questions those sources do not answer together: why source scores disagree; whether an observation is fresh, sufficiently sampled, and comparable; what trade-off fits the user's present viewing goal; and whether the user's eventual decision worked.

The current validated product thesis is: “The source tells you its score. FandomRates helps you decide what to do with it.” The first implemented loop is intentionally narrow: user opens a title evidence page, chooses safe pick, short commitment, or wildcard intent, sees an interpretation based on source count/spread/freshness and title metadata, saves the title locally, then marks watched or dropped. This creates a private decision log without requiring authentication or claiming to have a trained personal recommendation model.

Future business/product metrics must measure decision utility, not raw page views: time-to-choice, decision satisfaction, watched/completed versus dropped outcomes, calibration of confidence, correction rate, diversity of choices, source freshness, missingness, watchlist re-entry usefulness, alert usefulness, and opt-out/complaint rates. Expansion beyond the decision brief is gated on evidence that the product improves decisions relative to a source-score-only control.

### Target user personas and workflows

1. Casual chooser: searches a title or shortlist, has a time/commitment goal, wants a clear evidence brief, and does not want to learn statistical jargon.
2. Seasonal follower: returns for airing status, episode availability, freshness, and schedule changes; spoiler controls are future work, not a current promise.
3. Evidence-minded fan: compares AniList, MyAnimeList-derived, Kitsu, and future permitted sources; inspects raw values, distributions, timestamps, and methodology.
4. Completionist or reviewer: records watched/dropped outcomes and later checks whether a prediction or source disagreement was useful.
5. Small-group chooser, pending implementation: friends privately submit candidates and constraints, receive a shortlist, record the final choice, and delete/export the group record; spoiler controls are a prerequisite.

Primary current workflow: Home search -> title evidence page -> source-native score cards -> decision brief -> choose intent -> save/watch/drop outcome -> private watchlist. Secondary workflow: Home -> comparisons -> source snapshots/anomalies -> methodology. Correction workflow: public correction form -> server-side validation -> private provider-side review lead.

### Comprehensive technology stack architecture

Frontend tier: Next.js 14 App Router, React 18, TypeScript 5.3, Tailwind CSS 3.4, Framer Motion 11, Recharts 2, Lucide React. Server components perform Supabase reads for public pages; client components handle local decision state, animation, mobile navigation, and charts.

Backend/API tier: Next.js server-rendered route modules and one feedback API route. Python 3.11 scraper with requests/HTTP source adapters, psycopg2-binary database access, tenacity/backoff behavior, explicit configuration validation, and command modes for routine sync, discovery, catalog scores, refresh, and optional episode crawling.

Database and storage layer: Supabase-hosted PostgreSQL accessed by @supabase/supabase-js in Next.js and psycopg2 in Python. Existing public aggregate tables include anime, seasons, episodes, score_snapshots, anomaly_events, battles, and reviews. No ORM is used. Current browser decision storage is localStorage under fandomrates.watchlist.v1; there is no account/authenticated preference database yet.

DevOps and infrastructure: GitHub repository agenticweeb/fandomrates; GitHub Actions with immutable action SHAs; Vercel deployment and preview checks; protected GitHub Actions environment named production for database secrets; scheduled fast score workflow, catalog backfill workflow, and separate weekly/manual episode workflow.

### Environment and runtime prerequisites

Required frontend public variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SITE_URL. Required scraper-only secrets: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT. Optional/required secure runtime setting: DB_SSLMODE, defaulting to require in validated configuration. FANDOMRATES_ENV selects local, CI, or production behavior. Never expose DB_* values to the browser or commit real values.

Target runtime: Ubuntu-like CI runner, Node.js 20 in GitHub Actions, npm with tracked package-lock.json, Python 3.11 in GitHub Actions, PostgreSQL-compatible Supabase database, browser with localStorage for the current private decision log.

---

## 2. ADVANCED ARCHITECTURAL DECISIONS & PARADIGMS

### Macro pattern

The system is a modular monolith with a source-adapter ingestion subsystem and a server-rendered Next.js product surface. It is not yet a microservice architecture. Domain boundaries are: canonical anime identity, source observations, evidence interpretation, comparison/anomaly context, correction intake, and user-local decision outcomes.

### Data-flow vectors

Catalog discovery vector: GitHub Actions schedule -> scraper configuration validation -> read-only schema preflight -> AniList paginated request -> response validation -> source identity mapping -> idempotent anime update/insert -> source-native score snapshot -> committed PostgreSQL row.

Routine refresh vector: scheduled action -> validated DB secrets -> configured source fetches -> source-native current score/popularity -> six-hour duplicate suppression query -> score_snapshots insert when no recent observation -> public Next.js server query -> source-labelled UI.

Episode vector: separate weekly/manual action -> scraper with explicit --episodes flag -> AniList/Jikan episode requests -> source-returned episode metadata only -> seasons/episodes upsert. Routine --run intentionally skips this expensive vector.

Homepage vector: browser GET / or GET /?q=term -> Next.js server component -> Supabase bounded title query and bounded snapshot query -> AnimeExplorer server-rendered form/cards -> canonical /anime/id link.

Evidence page vector: browser GET /anime/id -> metadata lookup -> anime row and source snapshots -> latest-per-source map -> source cards + DecisionBrief client island -> localStorage on explicit user action only.

Decision vector: user selects intent -> deterministic browser-side interpretation using source count, score spread, age, and title episode metadata -> explicit save/watched/dropped action -> localStorage entry -> /watchlist client page reads only that local browser store.

Correction vector: user enters source link and context -> POST /api/feedback -> content-type/size/field validation -> provider intake write or controlled response -> no public accusation profile.

### Security and identity architecture

There is no user authentication or server-side personal profile in the current decision loop. Browser-local outcomes are explicit and private to the device. Public reads rely on Supabase anon access and database RLS policies. Scraper credentials are GitHub protected environment secrets. Correction submission is server-side and should not expose provider errors or credentials. Future account work must add explicit consent, export, deletion, privacy defaults, and separation between private outcomes and public aggregate training data.

### Engineering conventions and constraints

TypeScript variables and functions use camelCase; React components and TypeScript interfaces use PascalCase; database columns remain snake_case; routes use lowercase path segments; Python functions use snake_case. Source observations preserve raw source identity, score scale, timestamp, and missingness. Missing values are never converted into zero and one source is never silently substituted for another.

Async behavior is server-side and bounded. Source work uses provider-specific limits, retries, and checkpointable workflows. UI client state is restricted to interaction state and explicit localStorage persistence. Errors are fail-closed: invalid DB configuration stops the scraper; server query failures reach retryable boundaries; empty search results are distinct from data-source failures.

Anomaly language is neutral: observed change, unusual pattern, source disagreement, or evidence mixed. No public user-level accusation, identity inference, intent claim, or synthetic fallback is permitted. Review ingestion remains disabled pending source permission and privacy review.

---

## 3. ABSOLUTE EXHAUSTIVE REPOSITORY TREE

Every file below is classified relative to origin/main and the current working state.

└── FandomRates-product-research-2026-10.md [CREATED]
└── FandomRates-research-and-product-thesis-2026-10-23.md [CREATED]
└── FandomRates-reviewed-plan.md [UNTOUCHED]
└── README.md [MODIFIED]
├── app/
    ├── anime/
        ├── [id]/
            └── error.tsx [CREATED]
├── app/
    ├── anime/
        ├── [id]/
            └── loading.tsx [CREATED]
├── app/
    ├── anime/
        ├── [id]/
            └── page.tsx [MODIFIED]
├── app/
    ├── api/
        ├── feedback/
            └── route.ts [MODIFIED]
├── app/
    ├── battle/
        ├── [slug]/
            └── page.tsx [MODIFIED]
├── app/
    ├── battles/
        └── page.tsx [UNTOUCHED]
├── app/
    └── error.tsx [CREATED]
├── app/
    └── globals.css [UNTOUCHED]
├── app/
    └── layout.tsx [MODIFIED]
├── app/
    └── loading.tsx [CREATED]
├── app/
    ├── methodology/
        └── page.tsx [UNTOUCHED]
├── app/
    └── page.tsx [MODIFIED]
├── app/
    └── robots.ts [CREATED]
├── app/
    └── sitemap.ts [CREATED]
├── app/
    ├── submit/
        └── page.tsx [MODIFIED]
├── app/
    ├── watchlist/
        └── page.tsx [CREATED]
├── app/
    ├── why/
        └── page.tsx [MODIFIED]
├── components/
    └── AnimeExplorer.tsx [MODIFIED]
├── components/
    └── DashboardContainer.tsx [MODIFIED]
├── components/
    └── DataFreshnessBadge.tsx [UNTOUCHED]
├── components/
    └── DecisionBrief.tsx [MODIFIED]
├── components/
    └── EpisodeCard.tsx [UNTOUCHED]
├── components/
    └── EpisodeDetail.tsx [UNTOUCHED]
├── components/
    └── EpisodeGrid.tsx [UNTOUCHED]
├── components/
    └── EpisodeTimeline.tsx [UNTOUCHED]
├── components/
    └── Navbar.tsx [MODIFIED]
├── components/
    └── PlatformBattlegrounds.tsx [UNTOUCHED]
├── components/
    └── PopularityMetrics.tsx [UNTOUCHED]
├── components/
    └── ProfileEvidence.tsx [UNTOUCHED]
├── components/
    └── RatingDistributionChart.tsx [UNTOUCHED]
├── components/
    └── ReviewAuditLog.tsx [UNTOUCHED]
├── components/
    └── ScoreChart.tsx [UNTOUCHED]
├── components/
    └── SeasonSelector.tsx [UNTOUCHED]
└── env.example [UNTOUCHED]
└── eslintrc.json [UNTOUCHED]
├── github/
    ├── workflows/
        └── catalog-backfill.yml [UNTOUCHED]
├── github/
    ├── workflows/
        └── ci.yml [UNTOUCHED]
├── github/
    ├── workflows/
        └── episode-sync.yml [UNTOUCHED]
├── github/
    ├── workflows/
        └── scrape.yml [UNTOUCHED]
└── gitignore [UNTOUCHED]
├── lib/
    ├── decisionLog.ts [CREATED]
    └── supabase.ts [UNTOUCHED]
└── next-env.d.ts [UNTOUCHED]
└── package-lock.json [UNTOUCHED]
└── package.json [UNTOUCHED]
└── postcss.config.js [UNTOUCHED]
├── public/
    ├── images/
        └── fallback-image.svg [UNTOUCHED]
├── public/
    ├── images/
        └── mushoku-banner.jpg [UNTOUCHED]
├── public/
    ├── images/
        └── rezero-banner.jpg [UNTOUCHED]
├── public/
    ├── images/
        └── vs-divider.png [UNTOUCHED]
├── public/
    └── llms.txt [CREATED]
└── requirements.txt [UNTOUCHED]
└── scraper.py [MODIFIED]
└── scraper_config.py [UNTOUCHED]
└── tailwind.config.js [UNTOUCHED]
├── tests/
    └── test_scraper_config.py [UNTOUCHED]
├── tests/
    └── test_scraper_episode_logic.py [UNTOUCHED]
└── tsconfig.json [UNTOUCHED]
└── tsconfig.tsbuildinfo [GENERATED-IGNORED]
├── types/
    └── index.ts [UNTOUCHED]
├── types/
    ├── index/
        └── index.ts [UNTOUCHED]

---

## 4. GRANULAR DEPENDENCY AND PACKAGE MATRIX

| Package | Installed version | Utility and impact |
| @supabase/supabase-js | 2.118.0 | Browser/server PostgreSQL API client; server query dependency and public aggregate read boundary. |
| next | 14.2.35 | App Router, server components, metadata, loading/error boundaries, route generation. |
| react | 18.3.1 | Component rendering and client interaction islands. |
| react-dom | 18.3.1 | Web rendering runtime. |
| typescript | 5.3.3 | Static contract validation and build-time correctness. |
| tailwindcss | 3.4.19 | Utility styling for evidence cards, decision brief, navigation, and responsive layout. |
| framer-motion | 11.18.2 | Existing dashboard motion; client bundle overhead. |
| recharts | 2.15.4 | Existing score/distribution visualizations; client bundle overhead. |
| lucide-react | 0.344.0 | Existing navigation icons. |
| eslint | 8.57.0 | Non-interactive lint gate. |
| eslint-config-next | 14.1.4 | Next.js lint rules; currently reports existing img optimization warnings, not errors. |
| @types/node | 20.19.43 | Node and route typing. |
| @types/react | 18.3.31 | React typing. |
| @types/react-dom | 18.3.7 | React DOM typing. |
| autoprefixer | 10.6.1 | CSS compatibility processing. |
| postcss | 8.5.31 | Tailwind/PostCSS build pipeline. |
| tailwind-merge | 2.6.1 | Existing class merge utility. |
| clsx | 2.1.1 | Existing conditional class utility. |
| psycopg2-binary | requirements.txt declared | Python PostgreSQL connection layer for scraper. |
| requests | requirements.txt declared | Python HTTP source adapter layer. |
| tenacity | requirements.txt declared | Retry/backoff for source calls. |

No new third-party package was added for the decision loop; it uses existing React, Next.js, and browser localStorage primitives to keep the first validation slice low-risk.

---

## 5. HISTORICAL DEVELOPMENT LEDGER AND SPRINT ROADMAP

### Completed core milestones

- [x] Established repository and source map for agenticweeb/fandomrates.
- [x] Hardened scraper configuration and removed unsafe DB defaults.
- [x] Removed synthetic score/history/profile fabrication paths from production sync.
- [x] Added explicit catalog discovery and source-native AniList snapshots.
- [x] Split routine score refresh from optional episode crawling.
- [x] Added immutable GitHub Action SHAs, protected production environment, concurrency, timeout, and config preflight.
- [x] Added bounded server search, source score cards, error/loading boundaries, metadata, robots, sitemap, and llms.txt.
- [x] Opened and merged GitHub PR #1: https://github.com/agenticweeb/fandomrates/pull/1.

### Completed in this feature branch

- [x] Imported the previously validated post-PR search/SEO/ingestion tranche into a new clean branch from origin/main.
- [x] Added DecisionBrief client component with safe/short/wildcard intent, source-count/spread/freshness interpretation, explicit save, watched, and dropped actions.
- [x] Added local-only watchlist/decision log page.
- [x] Added Why FandomRates Exists product thesis page.
- [x] Updated desktop/mobile navigation to expose Rating explorer, Why this exists, and My decisions.
- [x] Updated public llms.txt to describe the decision-layer thesis.
- [x] Saved fresh product/competitor/fan/authenticity/retention/architecture research in FandomRates-research-and-product-thesis-2026-10-23.md.
- [x] Passed Python syntax/tests, TypeScript typecheck, production Next.js build, and lint with pre-existing img optimization warnings only.

### Active blockers and debt

- A new pull request for this branch has not yet been created at the serialization stop point; PR creation is the next delivery action after final commit/push.
- Existing image tags produce Next.js no-img-element warnings; convert trusted remote images to next/image only after remote host configuration and fallback behavior are verified.
- Search coverage depends on catalog ingestion and is not yet a complete all-anime identity graph.
- AniList terms restrict hoarding/mass collection and competing list/tracker services; broad ingestion requires legal/product review and must remain bounded.
- Jikan is unofficial and upstream-dependent; Kitsu numeric rate limit and redistribution terms remain unresolved in reviewed official material.
- The decision log is browser-local and not synchronized between devices; this is intentional for the pilot but not a complete account product.
- There is no empirical A/B or holdout evidence yet that the decision brief improves watch decisions.
- Cross-source score snapshots lack a fully modeled observation/provenance table, source URL, parser version, ETag, confidence, and explicit scale fields.
- Existing legacy battle/review components require a separate audit for unsupported assumptions, missing-source states, and image optimization.

---

## 6. CURRENT EXECUTION POINT AND ACTIVE RUNTIME STATE

Active objective: deliver the differentiated decision-product branch as a reviewable GitHub pull request, not merge directly to main.

Last logical mutation: added and validated the explainable DecisionBrief, local watchlist page, product thesis page, updated navigation and public AI-readable description, then imported the validated post-PR tranche into the clean branch from origin/main.

Current branch: feature/decision-intelligence.

Current base: origin/main at merge commit 015bdc9.

Current feature commits: 599a2e8, 59efa7b, e89f431, a7e9281, cd4a161. Current serialization hash: cd4a161.

Precise stop point: after three hostile critiques, remediation, local validation, push, and successful GitHub CI/Vercel checks on PR #2. The next operation is human review/merge decision, not another unreviewed scope expansion.

---

## 7. EXHAUSTIVE TOUCHED-FILE STRUCTURE REGISTRY

The following registry covers every file classified as CREATED or MODIFIED in the feature branch relative to origin/main, including the imported validated tranche.

### FILE: .env.example
Classification: configuration contract.
Responsibility: documents browser-public Supabase variables, scraper DB secret names, TLS default, runtime environment, and NEXT_PUBLIC_SITE_URL.
Structural contract: public variables may be exposed to browser code; DB_* values are scraper-only; NEXT_PUBLIC_SITE_URL is required for absolute sitemap/canonical production output.
Delta: added the public origin key and clarified source-specific variables.
Side effects: Vercel must define NEXT_PUBLIC_SITE_URL for sitemap and canonical metadata usefulness.

### FILE: .github/workflows/ci.yml
Classification: pull request quality gate.
Responsibility: clean checkout, Python setup/dependencies/tests, Node setup/npm ci, typecheck, lint, and production build with safe placeholders.
Structural contract: no production DB secrets; immutable actions; quality job must fail on type/build/test errors.
Delta: imported validated CI workflow.
Side effects: requires tracked package-lock.json.

### FILE: .github/workflows/scrape.yml
Classification: routine production ingestion workflow.
Responsibility: six-hour bounded source discovery and fast score refresh.
Structural contract: production environment, read-only contents permission, concurrency group, timeout, DB secret preflight, DB_SSLMODE=require, discovery/catalog-scores followed by fast --run.
Delta: imported validated separation of catalog score work and fast routine sync.
Side effects: no episode endpoint crawl in routine run.

### FILE: .github/workflows/catalog-backfill.yml
Classification: scheduled catalog coverage workflow.
Responsibility: pages 2 through 10 bounded popularity catalog backfill with per-page discovery and score insertion.
Structural contract: daily schedule/manual dispatch, 20-minute timeout, concurrency, production environment, required DB secrets.
Delta: imported validated bounded expansion path.
Side effects: expands search coverage without delaying score freshness job.

### FILE: .github/workflows/episode-sync.yml
Classification: low-frequency detailed ingestion workflow.
Responsibility: weekly/manual explicit episode metadata crawl.
Structural contract: only runs scraper --run --episodes, uses production secrets, 20-minute timeout and distinct concurrency.
Delta: imported validated separation of expensive episode crawling.
Side effects: slower API work is isolated from routine freshness.

### FILE: README.md
Classification: operational/product documentation.
Responsibility: architecture, schema, setup, source behavior, scraper commands, safety claims, and deployment guidance.
Delta: documents NEXT_PUBLIC_SITE_URL, fast routine mode, explicit --episodes, and separated episode workflow.
Side effects: operators must understand that routine --run does not populate episodes.

### FILE: app/layout.tsx
Classification: global App Router layout and metadata.
Responsibility: root HTML shell, Navbar, main width, footer, title template, and product description.
Delta: imported evidence-first metadata template.
Side effects: title/description affect all search previews.

### FILE: app/page.tsx
Classification: homepage server component.
Responsibility: bounded title search, source snapshot loading, battle/anomaly context, error propagation, and composition of AnimeExplorer/DashboardContainer.
Delta: imported server URL query search and bounded score data instead of unbounded catalog/snapshot reads.
Side effects: Supabase query errors reach app error boundary; q controls search state.

### FILE: app/loading.tsx
Classification: root loading boundary.
Responsibility: immediate skeleton while server data loads.
Delta: imported validated loading UI.

### FILE: app/error.tsx
Classification: root client error boundary.
Responsibility: distinguishes unavailable evidence from empty search and provides retry.
Delta: imported validated recovery UI.

### FILE: app/anime/[id]/page.tsx
Classification: title evidence server component.
Responsibility: validates numeric ID, fetches anime/source snapshots, builds latest-per-source view, renders provenance cards and DecisionBrief, provides dynamic metadata.
Delta: added title metadata and DecisionBrief insertion; imported prior evidence page.
Side effects: detail pages now contain an interactive local decision island.

### FILE: app/anime/[id]/loading.tsx
Classification: title loading boundary.
Responsibility: title evidence skeleton.
Delta: imported validated loading UI.

### FILE: app/anime/[id]/error.tsx
Classification: title error boundary.
Responsibility: retryable source/database failure presentation.
Delta: imported validated recovery UI.

### FILE: app/robots.ts
Classification: crawler metadata route.
Responsibility: allow public evidence pages, disallow API and correction intake, expose sitemap when site origin exists.
Delta: imported validated crawler rules.

### FILE: app/sitemap.ts
Classification: dynamic crawler metadata route.
Responsibility: canonical home/methodology/battles/anime URLs, bounded 500-title query, absolute origin requirement.
Delta: imported validated sitemap.

### FILE: app/watchlist/page.tsx
Classification: client-only private decision log page.
Responsibility: reads localStorage saved titles, renders intent/outcome state, allows clearing log, links back to evidence pages.
Interfaces: SavedTitle includes anime identity/cover, intent safe|short|wildcard, optional outcome watched|dropped, savedAt, updatedAt.
State: items array initialized after mount; clearAll removes STORAGE_KEY.
Side effects: no network and no account; local browser data only.

### FILE: app/why/page.tsx
Classification: static product-thesis page.
Responsibility: explains differentiation, three value pillars, non-goals, trust promise, and route to decision brief.
Side effects: provides an indexable explanation of why users should use the product alongside original sources.

### FILE: components/AnimeExplorer.tsx
Classification: server-rendered homepage search/catalog component.
Responsibility: GET form, result count, title cards, source-separated score labels, no-result state, methodology link.
Interfaces: AnimeExplorerProps includes anime, snapshots, query, total.
Methods: latestByPlatform groups newest non-null score per source; scoreLabel preserves unavailable.
Delta: imported validated server search and score-first display.

### FILE: components/DashboardContainer.tsx
Classification: client dashboard/comparison presentation.
Responsibility: hero, featured comparisons, source-separated comparison score cards, observed changes.
Delta: imported validated removal of blended cross-platform averages and accusatory labels.
Side effects: all score displays remain source-native.

### FILE: components/Navbar.tsx
Classification: client global navigation.
Responsibility: responsive desktop/mobile navigation, Escape close, expanded state, route links.
Delta: renamed primary route to Rating explorer and added Why this exists/My decisions links; retains Comparisons, Methodology, Corrections.
Side effects: users can reach the new product loop from every page.

### FILE: components/DecisionBrief.tsx
Classification: client decision-product island.
Responsibility: interprets current title evidence for a selected goal and persists explicit local actions.
Interfaces: DecisionBriefProps contains Anime and ScoreSnapshot[]; SavedTitle is local schema.
State: intent, saved, outcome.
Methods: readDecisionLog returns guarded validated localStorage records; evidence computes latest source snapshots, source count, descriptive score spread, newest age; persist writes/replaces title entry and outcome.
Constraints: state starts empty and hydrates in useEffect; no automatic storage before user action; no claim of personal prediction, confidence, or public rating.

### FILE: public/llms.txt
Classification: public crawler/AI orientation document.
Responsibility: describes decision-layer thesis, public routes, evidence vocabulary, trust/privacy boundaries.
Delta: changed from rating explorer framing to decision layer and added why/watchlist routes.
Side effects: machine-readable product positioning changes.

### FILE: scraper.py
Classification: Python source ingestion engine.
Responsibility: source calls, validated configuration, catalog discovery, current source snapshots, mapped franchise sync, optional episode pass, read-only schema preflight.
Delta: imported validated shared AniList page optimization, explicit fast mode, --episodes flag, catalog modes, no synthetic/profile harvesting.
Side effects: scheduled routine runs are materially shorter; detailed episodes require explicit mode.

### FILE: scraper_config.py
Classification: scraper configuration boundary.
Responsibility: fail-closed environment validation, numeric port validation, secure TLS default and connection timeout.
Delta: imported validated strict secret contract.

### FILE: types/index.ts
Classification: shared domain interfaces.
Responsibility: Anime, Season, Episode, Review, ScoreSnapshot, EpisodeScore, AnomalyEvent, SuspiciousProfile, CommunitySubmission, Battle interfaces.
Delta: inherited source-native nullable values and existing status/category types; no new backend type was required for local decision storage.

### FILE: FandomRates-product-research-2026-10.md
Classification: prior product research artifact.
Responsibility: initial evidence-first product, authenticity, ingestion, UX, and SEO direction.
Delta: imported from validated tranche.

### FILE: FandomRates-research-and-product-thesis-2026-10-23.md
Classification: current research/product thesis artifact.
Responsibility: records competitor findings, fan needs, authenticity constraints, API/legal constraints, ethical retention, product loops, measurable gates, and current implementation.
Delta: newly created in this feature branch.

### FILE: lib/decisionLog.ts
Classification: browser-local decision storage boundary.
Responsibility: validates the versioned localStorage record shape, reads/writes/upserts/removes explicit decisions, and exports JSON through a browser download.
Structural contract: only title identity, intent, optional watched/dropped outcome, and timestamps are accepted; malformed records are discarded; storage failures return false instead of crashing the page.
Delta: created during hostile-review remediation.
Side effects: local persistence remains device-local and non-encrypted; this module intentionally does not imply a trained personal model.

### Hostile-review remediation ledger
The three independent critiques identified an arbitrary safe-pick heuristic, one-source misinterpretation, hydration risk, overstatements around learning/export/privacy/spoiler safety, false-success scraper exits, battle outage masking, and a missing correction case reference. The follow-up changes remove the lower-uncertainty claim, use a descriptive spread statement, hydrate local decisions in an effect, validate and export/delete local records, state device-local limits, make scraper database failures non-zero, throw battle query errors into the route boundary, return a correction reference, and synchronize copy with the current pilot scope. Spoiler-safe UI remains deferred rather than claimed as shipped.
---

## 8. STRATEGIC RUNWAY

1. Immediate delivery: stage and commit PROJECT_CONTEXT.md, verify git diff --check, push feature/decision-intelligence to origin, and create a pull request against main. Verification: gh pr view shows a distinct open PR with this branch and main base.
2. Remote gates: wait for GitHub CI and Vercel preview. Verification: Python tests, npm typecheck, npm lint, npm build, deployment success. Existing image optimization warnings are acceptable but should be tracked.
3. Manual product acceptance: open the preview, search an indexed title, open its evidence page, choose each intent, save, mark watched/dropped, open My decisions, clear local log, and inspect Why this exists. Verify no localStorage action occurs before explicit user action.
4. Add unit tests for DecisionBrief evidence interpretation and a browser-level test for save/watched/dropped/clear behavior. Keep these tests deterministic by injecting a clock or testing pure functions separately from localStorage.
5. Next data model: add source_observations/provenance fields or a migration preserving source ID, source URL, native scale, fetched_at, observed_at, parser version, ETag/Last-Modified, content hash, match confidence, and deletion state. Do not expose review/user identifiers.
6. Next ingestion: implement durable per-source page/cursor checkpoints, source-specific token buckets, conditional GET, dead-letter jobs, provider health state, idempotent upserts, and priority tiers for user-requested/currently-airing/popular/stable records.
7. Next evidence UI: add timeline diffs, distributions, source divergence, minimum-n warnings, event annotations, title aliases, and source links. Every inference must have a visibly different treatment from observed data.
8. Next decision pilot: add a small pairwise calibration flow and record explicit feedback only with consent. Compare against source-score-only decisions using time-to-choice, satisfaction, completion/drop, calibration, diversity, and correction rate. Do not build opaque personalized ranking before this gate.
9. Deferred group beta: only after privacy/export/delete, spoiler-safe controls, moderation/reporting, rate limits, and legal review. Keep submissions private by default and do not expose individual ratings.
10. Do not expand to mass review crawling, public fake-voter labels, or tracker replacement until provider terms, data rights, privacy, and measured product value are established.

### Comprehensive validation regime

Run Python syntax and unittest discovery. Run npm run typecheck. Run npm run lint and distinguish warnings from failures. Run production npm run build with safe placeholder public variables. Run git diff --check and conflict-marker scan. Run GitHub CI on the PR. Run Vercel preview acceptance flows. Verify scraper config failure with missing DB_HOST and invalid DB_PORT. Verify routine workflow command does not include --episodes. Verify catalog backfill and episode workflow have separate concurrency groups. Verify robots disallows API/submit and sitemap emits only when NEXT_PUBLIC_SITE_URL exists. Verify local decision log survives reload, does not exist before click, and clears completely.

---

## 9. HARDWARE/STATE REHYDRATION BOOTSTRAP PROMPT

You are resuming FandomRates on branch feature/decision-intelligence for agenticweeb/fandomrates; first read PROJECT_CONTEXT.md and inspect git status, then finish the pending PR delivery action before adding scope. The product is an evidence-first anime decision layer, not a rating mirror: preserve source-native values, explain disagreement/freshness/uncertainty, and validate the private safe-pick/short/wildcard decision-to-watched-or-dropped loop before building broad recommendation or social features. Never fabricate scores, infer individual voter identity or intent, expose private outcomes, silently blend incompatible source populations, or crawl broad sources without current terms/rate-limit/legal review; run Python tests, TypeScript, lint, build, and remote CI before claiming completion.

--- END SCHEMA
```
