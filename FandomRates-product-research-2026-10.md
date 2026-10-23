# FandomRates product research and execution direction

## Decision

FandomRates should not become a universal mirror of every review for every anime. That approach is slow, expensive, privacy-sensitive, dependent on unofficial APIs, and not necessary for the user’s core question. The defensible product is an evidence-first anime rating interpretation service: preserve source-native scores, counts, timestamps, distributions, freshness, identity, and uncertainty, then explain why sources disagree.

A rating burst or polarized distribution can be genuine dissatisfaction, counter-mobilization, a release event, a platform change, or manipulation. Public ratings cannot prove individual identity, intent, automation, or the true opinion of all viewers. The interface must therefore say “unusual activity” or “evidence is mixed,” never “fake fans” or “fraud proven.”

## Why the GitHub workflow was slow

The previous schedule ran catalog discovery, catalog scoring, and the detailed mapped sync serially. Discovery and scoring fetched the same AniList page twice. The detailed sync then performed serial AniList, Jikan, and Kitsu calls and committed many database statements individually. Episode endpoints were fetched for every mapped part even during routine score refreshes. Retries and public API backoff could extend the run unpredictably.

The implementation now shares the AniList page between catalog upsert and snapshot insertion. Routine `--run` is fast mode and skips the slower episode endpoint pass. Episode synchronization is isolated in a separate weekly/manual workflow and is available explicitly with `python scraper.py --run --episodes`. This prevents an expensive detail refresh from blocking score freshness.

All-anime coverage must be incremental. A popularity page is not the whole catalog, and page numbers move as popularity changes. The next ingestion stage should use durable partition checkpoints, source-aware rate budgets, conditional caching, identity mappings, and a job queue. It should refresh aggregate observations by freshness tier and keep review-body sampling optional and bounded.

## Product experience

The first screen must answer three questions within seconds: what is FandomRates, what can I search, and what evidence will I see? The homepage now leads with “Compare anime ratings without losing the source,” a real server-backed search form, source-separated score cards, timestamps, coverage context, and an explicit no-verdict promise.

The high-value detail page should show the title identity, native source scores, sample/count context, score history, rating distribution, as-of time, missingness, source differences, and a “why this score” explanation. A single blended platform average is misleading because source populations, scales, eligibility, weighting, and timing differ.

Search must be a task, not a decorative filter. It now uses URL state and bounded server-side queries, so reload, sharing, and back/forward work. A backend error must remain distinct from zero results. The next search tranche should add aliases, native titles, exact/prefix ranking, pagination, and query telemetry.

Ethical retention should come only after evidence activation: local recent titles and saved comparisons first, then opt-in neutral weekly summaries for material accepted changes. No first-visit push prompt, dark urgency, individual targeting, or retention optimization based only on clicks.

## Authenticity model

The first authenticity layer should be an interpretable evidence vector per platform and time window:

- sample size, denominator proxies, eligibility and coverage;
- burst relative to a pre-event and peer baseline;
- mean/median and rating-distribution change;
- polarization, concentration, and uncertainty;
- known release or policy events;
- optional aggregate coordination signals only where lawful and permitted.

At least two independent signal families, a documented baseline, and manual/context review should be required before an event receives a stronger label. Raw and any adjusted views must remain side by side. Small samples need uncertainty intervals; a 100% result from eight ratings is not stronger evidence than a 92% result from thousands.

## SEO and AI discoverability

Google’s current guidance supports server-rendered meaningful HTML, unique metadata, crawlable links, true status codes, sitemaps, and structured data that matches visible content. Google does not require a special AI schema or file and does not guarantee AI inclusion. OpenAI distinguishes OAI-SearchBot for ChatGPT Search from GPTBot for possible training use. `llms.txt` is an optional orientation document, not a crawler permission or ranking guarantee.

The repository now includes route metadata for anime evidence pages, `robots.txt`, a canonical `sitemap.xml`, and a public `llms.txt`. `NEXT_PUBLIC_SITE_URL` must be set to the real public origin in Vercel for absolute canonical and sitemap URLs. Private correction and API routes are excluded from indexing.

## References

[1]: https://docs.anilist.co/guide/rate-limiting "AniList rate limiting"
[2]: https://docs.anilist.co/guide/graphql/pagination "AniList GraphQL pagination"
[3]: https://docs.api.jikan.moe/ "Jikan API documentation"
[4]: https://hummingbird-me.github.io/api-docs/ "Kitsu API documentation"
[5]: https://myanimelist.net/info.php?go=topanime "MyAnimeList weighted score explanation"
[6]: https://help.imdb.com/article/imdb/track-movies-tv/weighted-average-ratings/GWT2DSBYVT2F25SK "IMDb weighted average ratings"
[7]: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics "Google JavaScript SEO basics"
[8]: https://developers.google.com/search/docs/appearance/ai-features "Google AI features and SEO"
[9]: https://developers.openai.com/api/docs/bots "OpenAI crawler guidance"
[10]: https://www.nngroup.com/articles/recognition-and-recall/ "Nielsen Norman Group recognition and recall"
[11]: https://www.nngroup.com/articles/progressive-disclosure/ "Nielsen Norman Group progressive disclosure"
[12]: https://www.itl.nist.gov/div898/handbook/prc/section2/prc241.htm "NIST Wilson confidence intervals"
[13]: https://steamcommunity.com/games/593110/announcements/detail/1808664240333155775 "Valve User Reviews Revisited"
