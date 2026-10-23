# FandomRates: research and product thesis

## The hard answer

If FandomRates only repeats AniList, MyAnimeList, Kitsu, or IMDb scores, users are right to skip it. Those products already provide catalogs, lists, reviews, recommendations, social features, rankings, episode progress, and discovery. A darker dashboard is not a reason to switch.

The product must therefore become a decision layer: **help me choose what to watch next for my current situation, explain the trade-offs in the evidence, and learn whether the choice worked for me.** The source remains authoritative for its own value. FandomRates adds comparison, context, uncertainty, and a private outcome loop.

The first implementation slice is deliberately narrow. It does not pretend to have a recommendation model or a complete personal graph. It adds an explainable decision brief, safe-pick/short-commitment/wildcard goals, a private browser-local decision log, watched/dropped outcomes, and a clear explanation of why the product exists. Expansion is gated on evidence that this improves decisions rather than merely increasing clicks.

## What competitors already do

AniList combines tracking, discovery, statistics, customization, community, reviews, recommendations, and a GraphQL catalog. MyAnimeList combines rankings, seasonal pages, reviews, recommendations, lists, forums, and an API. Kitsu exposes discovery, libraries, trending/highest-rated views, and rating distributions. Anime-Planet provides tracking, tag-based recommendations, ratings, and discovery. IMDb provides weighted scores, distributions, watchlists, recommendations, and reviews. Reddit provides discussion and community intelligence. [1] [2] [3] [4] [5] [6]

The defensible gap is not another catalog or leaderboard. The reviewed official materials do not establish a single anime product that transparently combines source-native ratings, cross-source disagreement, freshness, uncertainty, event context, and personal decision outcomes. That is a narrower and more credible position than claiming to replace incumbent trackers.

## The three user loops

The first loop is **decision to outcome calibration**. A user chooses a goal, inspects a brief, saves a title, then later marks it watched or dropped. The immediate value is a faster, better-informed choice. The future value is learning whether the product’s reasoning matched the user. This is the seed of a private preference-and-outcome graph, but it must not be called a moat until users actually provide outcomes.

The second loop is **evidence-linked comparison**. A user returns when a watched title changes materially, a new episode arrives, a source disagreement widens, or a saved comparison becomes relevant again. The product explains what changed, which source reported it, how fresh it is, and whether the evidence is thin or conflicting.

The third loop is **small-group choice**, which is intentionally deferred until privacy, spoiler controls, moderation, and deletion are ready. Friends could privately submit constraints and candidates, receive a spoiler-safe shortlist, and record the final outcome without exposing each person’s private ratings.

## Trust and authenticity

A rating burst or unusual distribution is an aggregate observation. It is not proof of a fake person, bot, intent, or coordinated manipulation. NIST guidance describes anomaly detection as comparison against a normal profile and warns that benign activity can deviate from a profile, creating false positives. [7]

A trustworthy evidence view should show counts, distributions, mean/median, dispersion, quantiles, time windows, denominators, uncertainty intervals, and event context. Change-point or burst methods need minimum sample sizes, documented windows, missingness rules, matched controls, and multiple-comparison disclosure. NIST measurement guidance emphasizes expressing uncertainty; academic surveys note sensitivity to stationarity, training data, parameters, and delay. [8] [9]

The product language must remain graduated: “observed,” “unusual relative to baseline,” “evidence is mixed,” and “context needed.” It must never expose usernames or imply that an algorithm has established fraud. Any future moderation or review-verification workflow needs human review, reversible action, appeals, privacy suppression, and calibration metrics.

## Why fans may return

Anime viewing is episodic and social. Fans need help deciding what to watch, following seasonal releases, avoiding spoilers, comparing commitments, and understanding why their own taste differs from the crowd. A 2024 survey summarized by Crunchyroll reported frequent friend and online-community influence among anime viewers. A 2025 ACM study on spoilers found that algorithmic feeds commonly expose spoilers and that users want layered title, keyword, media, time, and report-based controls. [10] [11]

FandomRates should therefore optimize for time saved and decision confidence, not session length. Ethical return reasons include a meaningful watchlist change, a new episode, a streaming-availability change, a corrected source observation, a saved comparison becoming materially different, or a weekly digest the user explicitly requested. Notifications must be opt-in, event-specific, deduplicated, pausable, and spoiler-safe. Nielsen Norman Group and Material Design guidance support user control, progressive disclosure, and non-deceptive notification practices. [12] [13]

## Ingestion and legal constraints

AniList documents rate limits, pagination, terms, and operational limitations. The current official guidance warns that a temporary lower rate limit may apply and that access can be reduced during outages. The terms prohibit hoarding or mass collection and competing list/tracker services. [14] [15] [16] [17]

Jikan is an unofficial read-only REST API over scraped MyAnimeList data. Its documentation describes a 60 requests/minute and 3 requests/second limit, 24-hour caching, conditional request support, and upstream rate-limit risk. Kitsu documents JSON:API pagination, a default page size of 10, a maximum page size of 20, and `links.next`; its numeric rate limit and API-specific redistribution terms were not clear in the reviewed material and remain a launch blocker for broad ingestion. [18] [19]

The engineering response is source-specific adapters, canonical IDs plus match confidence, raw source observations, ETag/Last-Modified and content hashes, durable cursors, priority queues, token buckets, backoff, circuit breakers, idempotent upserts, dead-letter jobs, source deletion handling, and a bounded refresh policy. Broad catalog coverage must grow incrementally; it is not a reason to make the routine workflow crawl every episode endpoint.

## Measurable gates before expansion

The product should not add opaque recommendations, broad review crawling, social feeds, or normalization until a pilot measures improvement against incumbent-score-only decisions. Required measures are time-to-choice, decision satisfaction, watched/completed versus dropped outcomes, calibration of confidence, correction rate, diversity of choices, source freshness, missingness, and notification usefulness. A holdout or randomized comparison is preferable to self-reported enthusiasm alone.

A feature is successful only if it helps a real decision and remains understandable when the evidence is weak. If users do not save decisions or provide outcomes, the product should not claim to have a personal model. If the decision brief does not outperform a source-only page on usefulness or time-to-choice, the feature should be changed or removed.

## Current implementation in this branch

The branch imports the previously validated evidence/search/SEO/ingestion tranche and adds a decision brief to anime detail pages. Users can choose a viewing goal, inspect source count/spread/freshness context, save a title locally, and record watched or dropped. A private watchlist page makes the outcome loop visible. A “Why FandomRates exists” page makes the product promise explicit. Navigation exposes the decision log and thesis rather than hiding them behind a generic explorer label.

The local log is intentionally not a backend profile system. It avoids requiring authentication, avoids collecting private viewing behavior by default, and makes the current value demonstrable before building accounts, synchronization, or a model. The next stage should add aliases and cross-source entity confidence, event annotations, richer title comparison, spoiler-safe content metadata, and a measured pilot—not a mass review scraper.

## References

[1]: https://anilist.co/ "AniList official product"
[2]: https://myanimelist.net/ "MyAnimeList official product"
[3]: https://kitsu.io/ "Kitsu official product"
[4]: https://www.anime-planet.com/ "Anime-Planet official product"
[5]: https://www.imdb.com/ "IMDb official product"
[6]: https://www.reddit.com/dev/api/ "Reddit API documentation"
[7]: https://nvlpubs.nist.gov/nistpubs/legacy/sp/nistspecialpublication800-94.pdf "NIST SP 800-94"
[8]: https://nvlpubs.nist.gov/nistpubs/TechnicalNotes/NIST.TN.1900.pdf "NIST uncertainty guidance"
[9]: https://pmc.ncbi.nlm.nih.gov/articles/PMC5464762/ "Survey of time-series change-point detection"
[10]: https://www.crunchyroll.com/news/latest/2024/1/22/polygon-the-anime-opportunity-study-highlights "Anime Opportunity Study summary"
[11]: https://dl.acm.org/doi/full/10.1145/3706370.3727861 "Spoilers in social media study"
[12]: https://www.nngroup.com/articles/deceptive-patterns/ "Nielsen Norman Group deceptive patterns"
[13]: https://m3.material.io/foundations/content-design/notifications "Material Design notifications guidance"
[14]: https://docs.anilist.co/guide/rate-limiting "AniList rate limiting"
[15]: https://docs.anilist.co/guide/graphql/pagination "AniList pagination"
[16]: https://docs.anilist.co/guide/terms-of-use "AniList terms of use"
[17]: https://docs.anilist.co/guide/considerations "AniList operational considerations"
[18]: https://docs.api.jikan.moe/ "Jikan API documentation"
[19]: https://kitsu.docs.apiary.io/ "Kitsu API documentation"
