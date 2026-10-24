#!/usr/bin/env python
import os
import sys
import re
import time
import json
import argparse
import unicodedata
from datetime import datetime, timezone, timedelta
import requests
from scraper_config import load_local_dotenv, validate_config

# Dotenv is opt-in for local development only. CI/production never read a
# checked-out .env file.
load_local_dotenv()

# Profile caching dictionary to prevent redundant network hits
USER_PROFILE_CACHE = {}

# ==========================================
# 1. PARSER UTILITIES & HELPERS
# ==========================================
def extract_anilist_date(date_node):
    if not date_node:
        return None
    year = date_node.get("year")
    month = date_node.get("month")
    day = date_node.get("day")
    if year and month and day:
        return f"{year:04d}-{month:02d}-{day:02d}"
    return None

def parse_jikan_date(date_str):
    if not date_str:
        return None
    return date_str[:10]

def normalize_title_for_search(value):
    """Normalize search keys while preserving the original display title."""
    folded = unicodedata.normalize("NFKC", value or "").casefold()
    folded = "".join(char for char in unicodedata.normalize("NFKD", folded) if not unicodedata.combining(char))
    return re.sub(r"[^\w]+", " ", folded, flags=re.UNICODE).strip()

# ==========================================
# 2. DATABASE CONNECTION WITH PERSISTENT SOCKET
# ==========================================
DB_CONN = None

def get_db_connection():
    global DB_CONN
    if DB_CONN and not DB_CONN.closed:
        return DB_CONN
        
    import psycopg2
    config = validate_config()
    DB_CONN = psycopg2.connect(
        host=config.host,
        user=config.user,
        password=config.password,
        database=config.name,
        port=config.port,
        sslmode=config.sslmode,
        connect_timeout=config.connect_timeout,
        application_name="fandomrates-scraper",
        keepalives=1,
        keepalives_idle=30,
        keepalives_interval=10,
        keepalives_count=3,
    )
    return DB_CONN

def execute_query(query, params=None, fetch=False, fetch_one=False):
    conn = get_db_connection()
    result = None
    try:
        with conn.cursor() as cur:
            cur.execute(query, params)
            if fetch:
                result = cur.fetchall()
            elif fetch_one:
                result = cur.fetchone()
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    return result

# ==========================================
# 3. DEFINITIVE FRANCHISE MAPPINGS FOR 2026
# ==========================================
MAPPINGS = [
    {
        "anime_id": 1,  # Mushoku Tensei
        "title_english": "Mushoku Tensei: Jobless Reincarnation",
        "title_romaji": "Mushoku Tensei: Isekai Ittara Honki Dasu",
        "rival_anilist_id": 21355,
        "seasons": [
            {"season_number": 1, "anilist_ids": [108465, 127720], "mal_ids": [39535, 45576]},
            {"season_number": 2, "anilist_ids": [146065, 166873], "mal_ids": [51179, 55888]},
            {"season_number": 3, "anilist_ids": [178789], "mal_ids": [61623]}
        ]
    },
    {
        "anime_id": 2,  # Re:Zero
        "title_english": "Re:ZERO -Starting Life in Another World-",
        "title_romaji": "Re:Zero kara Hajimeru Isekai Seikatsu",
        "rival_anilist_id": 108465,
        "seasons": [
            {"season_number": 1, "anilist_ids": [21355], "mal_ids": [31240]},
            {"season_number": 2, "anilist_ids": [108632, 119661], "mal_ids": [39587, 42203]},
            {"season_number": 3, "anilist_ids": [163134], "mal_ids": [54857]},
            {"season_number": 4, "anilist_ids": [189046], "mal_ids": [63241]}
        ]
    }
]

# ==========================================
# 4. EXTERNAL API DATA FETCHERS
# ==========================================

def delay_api(seconds=1.5):
    time.sleep(seconds)

def safe_requests_get(url, params=None, timeout=60, attempts=5, backoff_base=5):
    for a in range(attempts):
        try:
            response = requests.get(url, params=params, timeout=timeout)
            if response.status_code == 429:
                retry_after = response.headers.get("Retry-After")
                try:
                    wait_time = max(1, int(retry_after)) if retry_after else backoff_base * (a + 1)
                except ValueError:
                    wait_time = backoff_base * (a + 1)
                print(f"       [System Retry] Rate limits hit. Sleeping {wait_time}s (Attempt {a+1}/{attempts})...")
                time.sleep(wait_time)
                continue
            if response.status_code >= 500 and a < attempts - 1:
                time.sleep(min(60, backoff_base * (2 ** a)))
                continue
            return response
        except requests.exceptions.RequestException as req_err:
            wait_time = backoff_base * (a + 1)
            print(f"       [System Warning] Network error: {req_err}. Retrying in {wait_time}s (Attempt {a+1}/{attempts})...")
            time.sleep(wait_time)
    return None

def safe_anilist_post(query, variables, timeout=60, attempts=3):
    url = "https://graphql.anilist.co"
    for attempt in range(attempts):
        try:
            response = requests.post(url, json={"query": query, "variables": variables}, timeout=timeout)
            if response.status_code == 429:
                retry_after = int(response.headers.get("Retry-After", 10))
                print(f"       [AniList Rate Limit] Sleeping {retry_after}s...")
                time.sleep(retry_after)
                continue
            if response.status_code == 200:
                payload = response.json()
                if payload.get("errors"):
                    print("       [AniList Error] GraphQL response contained errors; response quarantined.", file=sys.stderr)
                    return None
                return payload.get("data", {})
            else:
                print(f"       [AniList Error] Status {response.status_code}: {response.text[:100]}")
                break
        except requests.exceptions.ReadTimeout:
            print(f"       [AniList Timeout] Read timed out. Retrying in 3s (Attempt {attempt+1}/{attempts})...")
            time.sleep(3)
        except Exception as e:
            print(f"       [AniList Error] {e}")
            break
    return None

def fetch_anilist_media(anilist_id):
    query = """
    query ($id: Int) {
        Media(id: $id, type: ANIME) {
            id
            averageScore
            popularity
            title { english romaji }
            coverImage { extraLarge large }
            bannerImage
            description
            episodes
            status
            season
            seasonYear
            startDate { year month day }
            endDate { year month day }
            streamingEpisodes { title thumbnail }
            nextAiringEpisode { airingAt timeUntilAiring episode }
        }
    }
    """
    data = safe_anilist_post(query, {"id": anilist_id})
    if data:
        time.sleep(0.7)
        return data.get("Media", {})
    return None

def fetch_kitsu_data_from_mal(mal_id):
    # Kitsu uses MAL mappings to locate their own IDs
    url = f"https://kitsu.app/api/edge/mappings?filter[externalSite]=myanimelist/anime&filter[externalId]={mal_id}&include=item"
    response = safe_requests_get(url, timeout=20)
    if response and response.status_code == 200:
        data = response.json()
        included = data.get("included", [])
        if included:
            item = included[0]
            return item.get("id"), item.get("attributes", {})
    return None, None

def fetch_kitsu_reviews(kitsu_id, page_url=None):
    if not kitsu_id:
        return [], None
    url = page_url or f"https://kitsu.app/api/edge/anime/{kitsu_id}/reviews?include=user&sort=-createdAt&page[limit]=20"
    response = safe_requests_get(url, timeout=20)
    if response and response.status_code == 200:
        data = response.json()
        return data.get("data", []), data.get("links", {}).get("next")
    return [], None

def fetch_jikan_fallback_images(mal_id):
    url = f"https://api.jikan.moe/v4/anime/{mal_id}/full"
    response = safe_requests_get(url)
    if response and response.status_code == 200:
        data = response.json().get("data", {})
        images = data.get("images", {})
        jpg_images = images.get("jpg", {})
        cover_image = jpg_images.get("large_image_url") or jpg_images.get("image_url")
        delay_api(1.5)
        return {
            "score": data.get("score"),
            "members": data.get("members"),
            "cover_image_url": cover_image,
            "banner_image_url": cover_image,
            "title_english": data.get("title_english") or data.get("title"),
            "title_romaji": data.get("title"),
            "synopsis": data.get("synopsis")
        }
    return {}

def fetch_jikan_episodes(mal_id):
    url = f"https://api.jikan.moe/v4/anime/{mal_id}/episodes"
    episodes = []
    page = 1
    while True:
        response = safe_requests_get(url, params={"page": page, "limit": 100})
        if not response or response.status_code != 200:
            break
        data = response.json()
        page_data = data.get("data", [])
        if not page_data:
            break
        episodes.extend(page_data)
        if not data.get("pagination", {}).get("has_next_page", False):
            break
        page += 1
        delay_api(1.0)
    return episodes

def fetch_jikan_reviews_paginated(mal_id, page=1):
    url = f"https://api.jikan.moe/v4/anime/{mal_id}/reviews"
    response = safe_requests_get(url, params={"page": page})
    if response and response.status_code == 200:
        return response.json().get("data", [])
    return []

def fetch_jikan_user_stats(username):
    url = f"https://api.jikan.moe/v4/users/{username}/full"
    response = safe_requests_get(url)
    if response and response.status_code == 200:
        return response.json().get("data", {})
    return None

def fetch_anilist_reviews(media_id, page=1):
    query = """
    query ($mediaId: Int, $page: Int) {
      Page(page: $page, perPage: 25) {
        pageInfo { hasNextPage }
        reviews(mediaId: $mediaId, sort: CREATED_AT_DESC) {
          id
          user { name id createdAt }
          score
          summary
          createdAt
        }
      }
    }
    """
    data = safe_anilist_post(query, {"mediaId": media_id, "page": page})
    if data:
        return data.get("Page", {})
    return {}

def fetch_anilist_user_stats(username):
    query = """
    query ($username: String) {
      User(name: $username) {
        id
        name
        createdAt
        statistics {
          anime { count meanScore }
        }
        favourites {
          anime {
            nodes { id title { romaji } }
          }
        }
      }
    }
    """
    data = safe_anilist_post(query, {"username": username})
    if data:
        return data.get("User", {})
    return None


def discover_anilist_catalog(limit=50, page=1):
    """Discover canonical anime records without hard-coded franchise mappings."""
    query = """
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
          id idMal averageScore popularity episodes status season seasonYear updatedAt siteUrl
          title { english romaji native }
          synonyms
          coverImage { extraLarge large }
          bannerImage description
        }
      }
    }
    """
    page_size = min(max(int(limit), 1), 50)
    data = safe_anilist_post(query, {"page": max(1, int(page)), "perPage": page_size}) or {}
    return data.get("Page", {}).get("media", [])


def sync_anilist_catalog(limit=50, page=1, media_list=None):
    """Upsert discovered titles; detailed season sync remains source-scoped."""
    update_query = """
    UPDATE anime SET title_english = %s, title_romaji = %s, cover_image_url = %s,
      banner_image_url = %s, synopsis = %s, episodes = %s, status = %s,
      season = %s, season_year = %s WHERE anilist_id = %s RETURNING id;
    """
    insert_query = """
    INSERT INTO anime (anilist_id, title_english, title_romaji, cover_image_url,
      banner_image_url, synopsis, episodes, status, season, season_year)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    RETURNING id;
    """
    media_list = media_list if media_list is not None else discover_anilist_catalog(limit, page)
    for media in media_list:
        title = media.get("title", {})
        cover = media.get("coverImage", {})
        values = (
            title.get("english"), title.get("romaji"), cover.get("extraLarge") or cover.get("large"), media.get("bannerImage"),
            media.get("description"), media.get("episodes"), media.get("status"),
            media.get("season"), media.get("seasonYear"), media.get("id"),
        )
        updated = execute_query(update_query, values, fetch=True)
        if not updated:
            inserted = execute_query(insert_query, (media.get("id"),) + values[:-1], fetch=True)
            anime_id = inserted[0][0] if inserted else None
        else:
            anime_id = updated[0][0]
        if not anime_id:
            continue
        try:
            source_id = str(media.get("id"))
            display_title = title.get("english") or title.get("romaji") or title.get("native")
            execute_query(
                """INSERT INTO source_identities (anime_id, source, source_id, canonical_title, confidence, review_status, provenance_url)
                   VALUES (%s, 'anilist', %s, %s, 1.0000, 'accepted', %s)
                   ON CONFLICT (source, source_id) DO UPDATE SET anime_id = EXCLUDED.anime_id,
                     canonical_title = EXCLUDED.canonical_title, last_seen_at = NOW(), provenance_url = EXCLUDED.provenance_url;""",
                (anime_id, source_id, display_title, media.get("siteUrl")),
            )
            aliases = [(title.get("english"), "english"), (title.get("romaji"), "romaji"), (title.get("native"), "native")]
            aliases.extend((alias, "source_synonym") for alias in media.get("synonyms", []) if alias)
            for alias, alias_type in aliases:
                normalized_alias = normalize_title_for_search(alias)
                if not normalized_alias:
                    continue
                execute_query(
                    """INSERT INTO anime_title_aliases (anime_id, alias, normalized_alias, alias_type, source, source_id, provenance_url)
                       VALUES (%s, %s, %s, %s, 'anilist', %s, %s)
                       ON CONFLICT (anime_id, source, normalized_alias) DO UPDATE SET alias = EXCLUDED.alias,
                         alias_type = EXCLUDED.alias_type, observed_at = NOW(), provenance_url = EXCLUDED.provenance_url;""",
                    (anime_id, alias, normalized_alias, alias_type, source_id, media.get("siteUrl")),
                )
        except Exception as identity_error:
            # Keep catalog ingestion backward compatible until the migration is applied.
            print(f"       [Catalog Warning] Identity/alias tables unavailable; catalog row retained: {identity_error}", file=sys.stderr)
    print(f"[Catalog] Accepted {len(media_list)} canonical AniList anime records from page {page}.")
    return len(media_list)


def sync_catalog_score_snapshots(limit=50, page=1, media_list=None):
    """Store current AniList observations for discovered titles without inference."""
    observed_at = datetime.now(timezone.utc)
    insert_snapshot = """INSERT INTO score_snapshots (anime_id, platform, score, popularity, scraped_at) VALUES (%s, %s, %s, %s, %s);"""
    media_list = media_list if media_list is not None else discover_anilist_catalog(limit, page)
    inserted = 0
    for media in media_list:
        average_score = media.get("averageScore")
        if average_score is None:
            continue
        row = execute_query("SELECT id FROM anime WHERE anilist_id = %s;", (media.get("id"),), fetch_one=True)
        if not row:
            continue
        recent = execute_query(
            "SELECT id FROM score_snapshots WHERE anime_id = %s AND platform = 'anilist' AND scraped_at >= %s;",
            (row[0], observed_at - timedelta(hours=6)), fetch_one=True,
        )
        if not recent:
            execute_query(insert_snapshot, (row[0], "anilist", float(average_score) / 10.0, media.get("popularity"), observed_at.isoformat()))
            inserted += 1
    print(f"[Catalog] Stored {inserted} source-native AniList snapshots from page {page}.")
    return inserted

# ==========================================
# 5. CORE SYSTEM SYNCHRONIZER
# ==========================================
def ensure_database_schema_health():
    print("   [Preflight] Checking required database objects (read-only)...")
    required_tables = ("anime", "seasons", "episodes", "score_snapshots")
    rows = execute_query(
        "SELECT table_name FROM information_schema.tables "
        "WHERE table_schema = 'public' AND table_name = ANY(%s);",
        (list(required_tables),),
        fetch=True,
    )
    found = {row[0] for row in rows or []}
    missing = sorted(set(required_tables) - found)
    if missing:
        raise RuntimeError(
            "Database schema is missing required tables: " + ", ".join(missing) +
            ". Apply the checked-in migrations before running the scraper."
        )

def resolve_part_episode_limit(part_media, j_eps, streaming_eps, fallback_default=1):
    if part_media:
        status = (part_media.get("status") or "").upper()
        media_count = part_media.get("episodes")
        next_airing = part_media.get("nextAiringEpisode") or {}
        next_episode = next_airing.get("episode")

        if status == "RELEASING" and next_episode:
            return max(0, int(next_episode) - 1)

        if media_count and int(media_count) > 0:
            return int(media_count)

    if j_eps:
        return len(j_eps)

    if streaming_eps:
        return len(streaming_eps)

    return fallback_default

def harvest_live_reviews_and_profiles(*_args, **_kwargs):
    """Deprecated: user-level harvesting is disabled by product policy.

    Public analytics use aggregate, source-native observations only. This guard
    remains for compatibility with old callers but intentionally performs no
    network requests and writes no profile or review rows.
    """
    print("       [Privacy Guard] User-level review/profile harvesting is disabled.")


def run_sync(refresh_only=False, sync_episodes=False):
    validate_config()
    ensure_database_schema_health()

    print("   [Sync] Ingesting source-backed observations only...")
    cutoff_dt = datetime.now(timezone.utc) - timedelta(days=3650)
    if refresh_only:
        cutoff_dt = datetime.now(timezone.utc) - timedelta(days=3)
        print("   [Sync] Refresh mode enabled: focusing on the last 3 days of activity.")
    if not sync_episodes:
        print("   [Sync] Fast mode enabled: skipping episode endpoint crawling. Use --episodes for a bounded detail pass.")

    upsert_anime_query = """
    INSERT INTO anime (id, anilist_id, mal_id, title_english, title_romaji, cover_image_url, banner_image_url, synopsis, episodes, status, season, season_year)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    ON CONFLICT (id) DO UPDATE SET
        anilist_id = EXCLUDED.anilist_id, mal_id = EXCLUDED.mal_id, title_english = EXCLUDED.title_english, title_romaji = EXCLUDED.title_romaji, cover_image_url = EXCLUDED.cover_image_url, banner_image_url = EXCLUDED.banner_image_url, synopsis = EXCLUDED.synopsis, episodes = EXCLUDED.episodes, status = EXCLUDED.status, season = EXCLUDED.season, season_year = EXCLUDED.season_year;
    """

    upsert_season_query = """
    INSERT INTO seasons (anime_id, season_number, anilist_ids, mal_ids, title, title_english, title_romaji, episode_count, start_date, end_date, cover_image_url, banner_image_url)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    ON CONFLICT (anime_id, season_number) DO UPDATE SET
        anilist_ids = EXCLUDED.anilist_ids, mal_ids = EXCLUDED.mal_ids, title = EXCLUDED.title, title_english = EXCLUDED.title_english, title_romaji = EXCLUDED.title_romaji, episode_count = EXCLUDED.episode_count, start_date = EXCLUDED.start_date, end_date = EXCLUDED.end_date, cover_image_url = EXCLUDED.cover_image_url, banner_image_url = EXCLUDED.banner_image_url
    RETURNING id;
    """

    upsert_episode_query = """
    INSERT INTO episodes (season_id, anime_id, episode_number, episode_title, aired_date, thumbnail_url, rating, vote_count)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    ON CONFLICT (season_id, episode_number) DO UPDATE SET
        episode_title = EXCLUDED.episode_title, aired_date = EXCLUDED.aired_date, thumbnail_url = EXCLUDED.thumbnail_url, rating = EXCLUDED.rating, vote_count = EXCLUDED.vote_count;
    """

    insert_snapshot_query = """
    INSERT INTO score_snapshots (anime_id, platform, score, popularity, scraped_at)
    VALUES (%s, %s, %s, %s, %s);
    """

    sync_failures = 0
    for franchise in MAPPINGS:
        anime_id = franchise["anime_id"]
        default_eng = franchise["title_english"]
        default_rom = franchise["title_romaji"]
        rival_id = franchise.get("rival_anilist_id") or (21355 if anime_id == 1 else 108465)
        
        rep_anilist_id = franchise["seasons"][0]["anilist_ids"][0]
        rep_mal_id = franchise["seasons"][0]["mal_ids"][0]

        print(f"\n==========================================")
        print(f"Syncing Franchise ID {anime_id}: {default_eng}")
        print(f"==========================================")

        media = fetch_anilist_media(rep_anilist_id)
        al_score = None
        al_pop = None
        parent_cover = None
        parent_banner = None
        parent_synopsis = None

        if media:
            if media.get("averageScore") is not None:
                al_score = round(float(media["averageScore"]) / 10.0, 2)
            al_pop = media.get("popularity")
            parent_cover = media.get("coverImage", {}).get("extraLarge") or media.get("coverImage", {}).get("large")
            parent_banner = media.get("bannerImage")
            parent_synopsis = media.get("description")

        # Fetch actual Kitsu parent data for real snapshot mapping
        _, kitsu_attrs = fetch_kitsu_data_from_mal(rep_mal_id)
        mal_data = fetch_jikan_fallback_images(rep_mal_id)
        mal_score = mal_data.get("score")
        mal_pop = mal_data.get("members")
        kitsu_score = None
        kitsu_pop = None
        if kitsu_attrs:
            if kitsu_attrs.get("averageRating"):
                kitsu_score = round(float(kitsu_attrs["averageRating"]) / 10.0, 2)
            if kitsu_attrs.get("userCount"):
                kitsu_pop = int(kitsu_attrs["userCount"])

        observed_at = datetime.now(timezone.utc)
        source_snapshots = []
        if al_score is not None:
            source_snapshots.append(("anilist", al_score, al_pop))
        if kitsu_score is not None:
            source_snapshots.append(("kitsu", kitsu_score, kitsu_pop))
        if mal_score is not None:
            source_snapshots.append(("mal", float(mal_score), mal_pop))
        if not source_snapshots:
            print("       [Source Status] No source score returned; no snapshot written.")
        for platform, score, popularity in source_snapshots:
            recent = execute_query(
                "SELECT id FROM score_snapshots WHERE anime_id = %s AND platform = %s AND scraped_at >= %s;",
                (anime_id, platform, observed_at - timedelta(hours=6)),
                fetch_one=True,
            )
            if not recent:
                execute_query(insert_snapshot_query, (anime_id, platform, score, popularity, observed_at.isoformat()))

        try:
            if not media:
                print("   -> [Source Status] AniList metadata unavailable; skipping synthetic parent metadata.", file=sys.stderr)
                continue
            execute_query(upsert_anime_query, (
                anime_id, rep_anilist_id, rep_mal_id,
                media.get("title", {}).get("english") or default_eng,
                media.get("title", {}).get("romaji") or default_rom,
                parent_cover, parent_banner, parent_synopsis,
                media.get("episodes"), media.get("status"), media.get("season"), media.get("seasonYear"),
            ))
            print(f"   -> Parent franchise metrics upsert complete.")
        except Exception as e:
            sync_failures += 1
            print(f"   -> [Error] Failed to upsert parent anime ID {anime_id}: {e}", file=sys.stderr)
            continue

        if not sync_episodes:
            continue

        for s in franchise["seasons"]:
            season_number = s["season_number"]
            anilist_ids = s["anilist_ids"]
            mal_ids = s["mal_ids"]
            
            print(f"\n   -> Syncing Season {season_number} (Cours: {len(mal_ids)} parts)...")
            
            first_anilist_id = anilist_ids[0]
            first_mal_id = mal_ids[0]
            
            s_media = fetch_anilist_media(first_anilist_id)
            if s_media:
                s_title_eng = s_media.get("title", {}).get("english") or f"{default_eng} Season {season_number}"
                s_title_rom = s_media.get("title", {}).get("romaji") or f"{default_rom} Season {season_number}"
                s_cover = s_media.get("coverImage", {}).get("extraLarge") or s_media.get("coverImage", {}).get("large")
                s_banner = s_media.get("bannerImage")
                s_start = extract_anilist_date(s_media.get("startDate"))
                s_end = extract_anilist_date(s_media.get("endDate"))
            else:
                print("       -> AniList search failed. Deploying Jikan fallback routine...")
                s_fallback = fetch_jikan_fallback_images(first_mal_id)
                s_title_eng = s_fallback.get("title_english") or f"{default_eng} Season {season_number}"
                s_title_rom = s_fallback.get("title_romaji") or f"{default_rom} Season {season_number}"
                s_cover = s_fallback.get("cover_image_url")
                s_banner = s_fallback.get("banner_image_url")
                s_start = None
                s_end = None

            combined_episodes = []
            global_ep_num = 1

            for part_idx, (m_id, a_id) in enumerate(zip(mal_ids, anilist_ids)):
                print(f"       Part {part_idx + 1} (MAL: {m_id}, AniList: {a_id}): Fetching episodes...")
                j_eps = fetch_jikan_episodes(m_id)

                part_media = fetch_anilist_media(a_id) if a_id != first_anilist_id else s_media
                streaming_eps = part_media.get("streamingEpisodes", []) if part_media else []

                expected_episode_count = resolve_part_episode_limit(part_media, j_eps, streaming_eps, fallback_default=1)
                if part_media and part_media.get("status") and str(part_media.get("status", "")).upper() == "RELEASING":
                    next_airing = part_media.get("nextAiringEpisode") or {}
                    next_episode = next_airing.get("episode")
                    if next_episode:
                        print(f"       [Episode Sync] Season is still releasing; registering {expected_episode_count} aired episodes for part {part_idx + 1} (next episode {next_episode}).")
                    else:
                        print(f"       [Episode Sync] Using AniList episode count {expected_episode_count} for part {part_idx + 1}.")
                elif part_media and part_media.get("episodes") and int(part_media.get("episodes")) > 0:
                    print(f"       [Episode Sync] Using AniList episode count {expected_episode_count} for part {part_idx + 1} (Jikan returned {len(j_eps)} entries).")
                elif j_eps:
                    print(f"       [Episode Sync] Falling back to Jikan episode count {len(j_eps)} for part {part_idx + 1}.")
                else:
                    print(f"       [Episode Sync] No source episode metadata returned; skipping part {part_idx + 1}.")
                    continue

                for idx in range(expected_episode_count):
                    source_ep = j_eps[idx] if j_eps and idx < len(j_eps) else None
                    if source_ep is None:
                        continue
                    
                    # Safely align streaming thumbnails via title matching to avoid index mismatches
                    thumb_url = None
                    if source_ep and streaming_eps:
                        ep_title = source_ep.get("title")
                        if ep_title:
                            for s_ep in streaming_eps:
                                if s_ep.get("title") and ep_title.lower() in s_ep.get("title", "").lower():
                                    thumb_url = s_ep.get("thumbnail")
                                    break
                    if not thumb_url:
                        thumb_url = s_cover

                    ep_title = source_ep.get("title")

                    aired_date = parse_jikan_date(source_ep.get("aired")) if source_ep else None
                    raw_score = source_ep.get("score") if source_ep else None
                    rating_score = float(raw_score) if raw_score is not None else None

                    combined_episodes.append({
                        "episode_number": global_ep_num,
                        "episode_title": ep_title,
                        "aired_date": aired_date,
                        "thumbnail_url": thumb_url,
                        "rating": rating_score,
                        "vote_count": None
                    })
                    global_ep_num += 1

            total_ep_count = len(combined_episodes)
            if total_ep_count == 0 and s_media:
                total_ep_count = s_media.get("episodes") or 0

            try:
                season_rows = execute_query(upsert_season_query, (anime_id, season_number, anilist_ids, mal_ids, s_title_eng, s_title_eng, s_title_rom, total_ep_count, s_start, s_end, s_cover, s_banner), fetch=True)
                
                if season_rows:
                    season_db_id = season_rows[0][0]
                    
                    episodes_synced = 0
                    for ep in combined_episodes:
                        execute_query(upsert_episode_query, (season_db_id, anime_id, ep["episode_number"], ep["episode_title"], ep["aired_date"], ep["thumbnail_url"], ep["rating"], ep["vote_count"]))
                        episodes_synced += 1
                    print(f"       -> Sync complete. Registered {episodes_synced} episodes total.")
                    
                    print("       -> Review/profile harvesting disabled pending source and privacy approval.")
            except Exception as db_err:
                 sync_failures += 1
                 print(f"       -> [Error] Database operation failed for Season {season_number}: {db_err}", file=sys.stderr)

    if sync_failures:
        raise RuntimeError(f"Synchronization completed with {sync_failures} database failure(s); refusing a false-success exit.")
    print("\nSynchronization task finished.")

def parse_args():
    parser = argparse.ArgumentParser(description='FandomRates scraper')
    parser.add_argument('--run', action='store_true', help='Run the scraper sync')
    parser.add_argument('--refresh', action='store_true', help='Run a short refresh pass for recent activity only')
    parser.add_argument('--episodes', action='store_true', help='Include the slower Jikan/AniList episode metadata pass')
    parser.add_argument('--discover', action='store_true', help='Discover and upsert canonical anime from AniList')
    parser.add_argument('--catalog-scores', action='store_true', help='Store current AniList scores for discovered catalog titles')
    parser.add_argument('--limit', type=int, default=50, help='Maximum catalog titles for --discover (1-50)')
    parser.add_argument('--page', type=int, default=1, help='AniList popularity page for catalog operations')
    return parser.parse_args()

if __name__ == "__main__":
    args = parse_args()
    if not (args.run or args.refresh or args.discover or args.catalog_scores):
        raise SystemExit("Refusing implicit sync. Use --run, --refresh, --discover, or --catalog-scores explicitly.")
    try:
        validate_config()
        if args.discover or args.catalog_scores:
            ensure_database_schema_health()
            catalog_media = discover_anilist_catalog(args.limit, args.page) if args.discover and args.catalog_scores else None
            if args.discover:
                sync_anilist_catalog(args.limit, args.page, catalog_media)
            if args.catalog_scores:
                sync_catalog_score_snapshots(args.limit, args.page, catalog_media)
        elif args.refresh:
            run_sync(refresh_only=True, sync_episodes=args.episodes)
        else:
            run_sync(sync_episodes=args.episodes)
    except (ValueError, RuntimeError) as exc:
        print(f"[Configuration/Preflight Error] {exc}", file=sys.stderr)
        raise SystemExit(2)
