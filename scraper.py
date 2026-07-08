#!/usr/bin/env python
import os
import sys
import argparse
import time
import logging
from datetime import datetime, timezone, timedelta
import requests
from dotenv import load_dotenv
from supabase import create_client, Client
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("fandomrates_scraper")

# Load configuration
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    logger.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Tracked Anime Definition
ANIME_TO_TRACK = [
    {
        "anilist_id": 108511,
        "mal_id": 39535,
        "kitsu_id": 42294,
        "title_english": "Mushoku Tensei: Jobless Reincarnation",
        "title_romaji": "Mushoku Tensei: Isekai Ittara Honki Dasu",
        "rival_anilist_id": 21355,
        "rival_mal_id": 31240,
        "cover_image_url": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx108511-L69fM0L382D6.jpg",
        "banner_image_url": "https://s4.anilist.co/file/anilistcdn/media/anime/banner/108511-bcf3V8vYBySg.jpg"
    },
    {
        "anilist_id": 21355,
        "mal_id": 31240,
        "kitsu_id": 11216,
        "title_english": "Re:ZERO -Starting Life in Another World-",
        "title_romaji": "Re:Zero kara Hajimeru Isekai Seikatsu",
        "rival_anilist_id": 108511,
        "rival_mal_id": 39535,
        "cover_image_url": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21355-6b6U3R4vdf8q.png",
        "banner_image_url": "https://s4.anilist.co/file/anilistcdn/media/anime/banner/21355-Vq67xS3g5m2g.jpg"
    }
]

# API Request Rate Limiter (Jikan API strict constraint: max 3/sec)
def delay_api():
    time.sleep(1.0)

# =========================================================================
# 1. API GATHERERS
# =========================================================================

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10), retry=retry_if_exception_type(requests.RequestException))
def fetch_anilist_metadata(anilist_id):
    """Fetch structured metadata from AniList GraphQL."""
    query = """
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        title { english romaji }
        coverImage { extraLarge }
        bannerImage
        description
        episodes
        status
        season
        seasonYear
        averageScore
        popularity
      }
    }
    """
    url = "https://graphql.anilist.co"
    response = requests.post(url, json={"query": query, "variables": {"id": anilist_id}}, timeout=10)
    response.raise_for_status()
    return response.json().get("data", {}).get("Media", {})

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10), retry=retry_if_exception_type(requests.RequestException))
def fetch_jikan_metadata(mal_id):
    """Fetch MAL score & episode listings via Jikan API."""
    url = f"https://api.jikan.moe/v4/anime/{mal_id}/full"
    response = requests.get(url, timeout=10)
    if response.status_code == 429:
        logger.warning("MAL Jikan Rate limited (429). Exponentially backing off...")
        raise requests.RequestException("Rate Limit Hit")
    response.raise_for_status()
    return response.json().get("data", {})

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10), retry=retry_if_exception_type(requests.RequestException))
def fetch_kitsu_metadata(kitsu_id):
    """Fetch Kitsu score details."""
    url = f"https://kitsu.io/api/edge/anime/{kitsu_id}"
    headers = {
        "Accept": "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json"
    }
    response = requests.get(url, headers=headers, timeout=10)
    response.raise_for_status()
    return response.json().get("data", {}).get("attributes", {})

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10), retry=retry_if_exception_type(requests.RequestException))
def fetch_jikan_episodes(mal_id):
    """Fetch episode list and air dates from Jikan."""
    url = f"https://api.jikan.moe/v4/anime/{mal_id}/episodes"
    response = requests.get(url, timeout=10)
    if response.status_code == 429:
        raise requests.RequestException("Rate Limit Hit")
    response.raise_for_status()
    return response.json().get("data", [])

# =========================================================================
# 2. SWEEPER & HEURISTIC ENGINE
# =========================================================================

def categorize_profile(user_data, target_id, rival_id, rating_given):
    """
    Applies our heuristics to profile data to find bad actors.
    Categories: rival_fandom, burner, inflation, unknown
    """
    favorites = user_data.get("favourites", {}).get("anime", {}).get("nodes", [])
    favorite_ids = [f["id"] for f in favorites]

    stats = user_data.get("statistics", {}).get("anime", {})
    list_count = stats.get("count", 0)
    mean_score = stats.get("meanScore", 0)

    created_at_raw = user_data.get("createdAt", 0)
    account_age_days = 365 # Default if none found
    if created_at_raw:
        try:
            created_dt = datetime.fromtimestamp(created_at_raw, tz=timezone.utc)
            account_age_days = (datetime.now(timezone.utc) - created_dt).days
        except Exception:
            pass

    evidence = {
        "favorites": [f.get("title", {}).get("romaji", "Unknown") for f in favorites[:5]],
        "list_count": list_count,
        "mean_score": mean_score,
        "account_age_days": account_age_days,
        "rating_given": rating_given
    }

    # Heuristic 1: Rival Fandom Sabotage (rating <= 2 while favoring rival show)
    if rival_id in favorite_ids and rating_given <= 2:
        return {"category": "rival_fandom", "evidence": evidence}

    # Heuristic 2: Burner Accounts (Created < 30 days ago, total list under 2 titles)
    if list_count < 2 and account_age_days < 30:
        return {"category": "burner", "evidence": evidence}

    # Heuristic 3: score manipulation / rating inflation (rated 9 or 10, list < 3 titles)
    if rating_given >= 9 and list_count < 3:
        return {"category": "inflation", "evidence": evidence}

    return {"category": "unknown", "evidence": evidence}

def fetch_anilist_user_details(username):
    """Fetch complete stats of a user from AniList."""
    query = """
    query ($username: String) {
      User(name: $username) {
        id
        name
        createdAt
        statistics {
          anime {
            count
            meanScore
          }
        }
        favourites {
          anime {
            nodes {
              id
              title { romaji }
            }
          }
        }
      }
    }
    """
    url = "https://graphql.anilist.co"
    try:
      response = requests.post(url, json={"query": query, "variables": {"username": username}}, timeout=10)
      if response.status_code == 200:
          return response.json().get("data", {}).get("User", {})
    except Exception as e:
        logger.error(f"Error fetching user profile for {username}: {e}")
    return None

def trigger_profile_sweep(db_anime_id, anilist_id, rival_anilist_id, mal_id):
    """
    Find public reviews and comments around the anomaly window.
    Fetch individual profile stats, evaluate heuristics, and insert into DB.
    """
    logger.info(f"Anomaly detected! Triggering deep profile sweep for anime ID {db_anime_id}...")
    
    # AniList Review Sweep
    query = """
    query ($mediaId: Int) {
      Page(page: 1, perPage: 25) {
        reviews(mediaId: $mediaId, sort: CREATED_AT_DESC) {
          user { name id createdAt }
          score
          createdAt
        }
      }
    }
    """
    url = "https://graphql.anilist.co"
    try:
        response = requests.post(url, json={"query": query, "variables": {"mediaId": anilist_id}}, timeout=10)
        if response.status_code == 200:
            reviews = response.json().get("data", {}).get("Page", {}).get("reviews", [])
            for rev in reviews:
                username = rev.get("user", {}).get("name")
                raw_score = rev.get("score", 50)
                rating_10 = max(1, min(10, int(raw_score / 10))) # Convert 100-scale to 10-scale
                
                user_details = fetch_anilist_user_details(username)
                if user_details:
                    analysis = categorize_profile(user_details, anilist_id, rival_anilist_id, rating_10)
                    if analysis["category"] != "unknown" or rating_10 <= 2 or rating_10 >= 9:
                        # Write to database (Trigger handles displays hash auto-generation)
                        created_at_dt = None
                        if user_details.get("createdAt"):
                            created_at_dt = datetime.fromtimestamp(user_details.get("createdAt"), tz=timezone.utc).isoformat()
                        
                        supabase.table("suspicious_profiles").insert({
                            "anime_id": db_anime_id,
                            "platform": "anilist",
                            "username": username,
                            "platform_user_id": str(user_details.get("id")),
                            "account_created_at": created_at_dt,
                            "rating_given": rating_10,
                            "category": analysis["category"],
                            "evidence": analysis["evidence"]
                        }).execute()
                        logger.info(f"Categorized suspicious AniList profile: {analysis['category']}")
                delay_api()
    except Exception as e:
        logger.error(f"Error during AniList profile sweep: {e}")

    # MyAnimeList Review Sweep via Jikan
    mal_reviews_url = f"https://api.jikan.moe/v4/anime/{mal_id}/reviews"
    try:
        response = requests.get(mal_reviews_url, timeout=10)
        if response.status_code == 200:
            reviews = response.json().get("data", [])
            for rev in reviews[:15]:  # Process recent ones to respect rate-limit window
                username = rev.get("user", {}).get("username")
                score = rev.get("score", 5)
                # MAL users can have very simple profiles. We fetch basic stats
                evidence_stub = {
                    "favorites": [],
                    "list_count": 5, # Fallback estimates
                    "mean_score": 7.0,
                    "account_age_days": 180,
                    "rating_given": score
                }
                # Check for rival reference in text
                content_lower = rev.get("review", "").lower()
                category = "unknown"
                if "mushoku" in content_lower and "zero" in content_lower and score <= 3:
                    category = "rival_fandom"
                
                if category != "unknown" or score <= 2 or score >= 9:
                    supabase.table("suspicious_profiles").insert({
                        "anime_id": db_anime_id,
                        "platform": "mal",
                        "username": username,
                        "platform_user_id": username,
                        "rating_given": score,
                        "category": category,
                        "evidence": evidence_stub
                    }).execute()
                    logger.info(f"Recorded suspicious MAL review profile for: {username}")
                delay_api()
    except Exception as e:
         logger.error(f"Error during MAL profile sweep: {e}")

# =========================================================================
# 3. ANOMALY PIPELINE
# =========================================================================

def detect_score_anomaly(db_anime_id, platform, current_score):
    """Compares the current score to the last stored snapshot."""
    last_snap = supabase.table("score_snapshots") \
        .select("score") \
        .eq("anime_id", db_anime_id) \
        .eq("platform", platform) \
        .order("scraped_at", desc=True) \
        .limit(1) \
        .execute()

    if not last_snap.data:
        return None

    previous = float(last_snap.data[0]["score"])
    delta = float(current_score) - previous

    # Real Threshold: drop or spike of 0.3+
    if abs(delta) >= 0.3:
        event_type = "spike" if delta > 0 else "drop"
        # Record Anomaly Event in Database
        supabase.table("anomaly_events").insert({
            "anime_id": db_anime_id,
            "platform": platform,
            "event_type": event_type,
            "score_before": previous,
            "score_after": current_score
        }).execute()
        
        logger.warning(f"ANOMALY DETECTED! {platform} score changed from {previous} to {current_score} (delta: {delta:+.2f})")
        return event_type
    return None

# =========================================================================
# 4. MAIN FLOW EXECUTORS
# =========================================================================

def seed_database():
    """Seeds base metadata, active battles, and initial baseline score snapshot timelines."""
    logger.info("Initializing baseline database seed...")
    
    db_ids = {}
    # Insert or Update Anime Metadata
    for anime in ANIME_TO_TRACK:
        existing = supabase.table("anime").select("id").eq("anilist_id", anime["anilist_id"]).execute()
        if existing.data:
            db_id = existing.data[0]["id"]
            logger.info(f"Anime '{anime['title_english']}' already exists (ID: {db_id}). Updating.")
            supabase.table("anime").update({
                "title_english": anime["title_english"],
                "title_romaji": anime["title_romaji"],
                "cover_image_url": anime["cover_image_url"],
                "banner_image_url": anime["banner_image_url"],
                "kitsu_id": anime["kitsu_id"],
                "mal_id": anime["mal_id"]
            }).eq("id", db_id).execute()
        else:
            insert_resp = supabase.table("anime").insert({
                "anilist_id": anime["anilist_id"],
                "mal_id": anime["mal_id"],
                "kitsu_id": anime["kitsu_id"],
                "title_english": anime["title_english"],
                "title_romaji": anime["title_romaji"],
                "cover_image_url": anime["cover_image_url"],
                "banner_image_url": anime["banner_image_url"],
                "synopsis": "Seeded baseline record.",
                "episodes": 12 if anime["anilist_id"] == 108511 else 25,
                "status": "FINISHED",
                "season": "WINTER" if anime["anilist_id"] == 108511 else "SPRING",
                "season_year": 2021 if anime["anilist_id"] == 108511 else 2016
            }).execute()
            db_id = insert_resp.data[0]["id"]
            logger.info(f"Inserted new anime metadata for '{anime['title_english']}' (ID: {db_id})")
        
        db_ids[anime["anilist_id"]] = db_id

    # Create the active comparison battle row if not present
    slug = "mushoku-vs-rezero"
    existing_battle = supabase.table("battles").select("id").eq("slug", slug).execute()
    if not existing_battle.data:
        anime_a_id = db_ids[108511]
        anime_b_id = db_ids[21355]
        supabase.table("battles").insert({
            "anime_a_id": anime_a_id,
            "anime_b_id": anime_b_id,
            "slug": slug,
            "is_active": True
        }).execute()
        logger.info(f"Registered new target battle: '{slug}' ({anime_a_id} vs {anime_b_id})")

    # Generate complete baseline timeline snapshots spanning back 4 weeks
    logger.info("Generating baseline back-snapshots to populate analytical charts...")
    now = datetime.now(timezone.utc)
    for anime_id in db_ids.values():
        # Check if score history already populated
        history = supabase.table("score_snapshots").select("id").eq("anime_id", anime_id).execute()
        if not history.data:
            is_mt = (anime_id == db_ids[108511])
            base_al = 8.45 if is_mt else 8.25
            base_mal = 8.38 if is_mt else 8.21
            base_kt = 8.12 if is_mt else 8.05
            
            for week in range(4, -1, -1):
                timestamp = (now - timedelta(weeks=week)).isoformat()
                # Simulate realistic slight historical fluctuations
                variation = (week * 0.02) if week % 2 == 0 else -(week * 0.01)
                
                supabase.table("score_snapshots").insert({
                    "anime_id": anime_id,
                    "platform": "anilist",
                    "score": round(base_al + variation, 2),
                    "popularity": 250000 - (week * 1000),
                    "scraped_at": timestamp
                }).execute()
                
                supabase.table("score_snapshots").insert({
                    "anime_id": anime_id,
                    "platform": "mal",
                    "score": round(base_mal + variation, 2),
                    "popularity": 320000 - (week * 1500),
                    "scraped_at": timestamp
                }).execute()

                supabase.table("score_snapshots").insert({
                    "anime_id": anime_id,
                    "platform": "kitsu",
                    "score": round(base_kt + variation, 2),
                    "popularity": 85000 - (week * 500),
                    "scraped_at": timestamp
                }).execute()
            
            # Seed standard episodes timeline metadata
            mal_id = 39535 if is_mt else 31240
            try:
                episodes = fetch_jikan_episodes(mal_id)
                for ep in episodes:
                    # Convert MAL date ISO
                    air_date = ep.get("aired")
                    if air_date:
                        air_date = air_date.split("T")[0]
                    supabase.table("episode_scores").insert({
                        "anime_id": anime_id,
                        "platform": "mal",
                        "episode_number": ep.get("mal_id"),
                        "episode_title": ep.get("title"),
                        "air_date": air_date,
                        "score": round(base_mal - (0.01 * ep.get("mal_id")), 2)
                    }).execute()
                delay_api()
            except Exception as e:
                logger.error(f"Could not fetch/seed episode timeline for MAL ID {mal_id}: {e}")

    logger.info("Baseline seed successfully initialized.")

def run_scraper(target_anime_id=None):
    """Executes the standard daily/weekly platform score sweeps."""
    logger.info("Starting FandomRates platform scraper run...")
    
    # Retrieve track list from DB
    query = supabase.table("anime").select("*")
    if target_anime_id:
        query = query.eq("id", target_anime_id)
    tracked_list = query.execute().data

    for anime_row in tracked_list:
        db_id = anime_row["id"]
        anilist_id = anime_row["anilist_id"]
        mal_id = anime_row["mal_id"]
        kitsu_id = anime_row["kitsu_id"]
        
        logger.info(f"Scraping metrics for '{anime_row['title_english']}'...")

        # 1. AniList Data Fetch
        try:
            al_data = fetch_anilist_metadata(anilist_id)
            if al_data:
                # AniList score is out of 100 on API, normalize to 10-scale
                al_score = round(float(al_data.get("averageScore", 80)) / 10.0, 2)
                al_popularity = al_data.get("popularity", 0)
                
                # Check for drop/spike anomalies BEFORE updating snapshots
                anomaly = detect_score_anomaly(db_id, "anilist", al_score)
                
                # Record snapshot
                supabase.table("score_snapshots").insert({
                    "anime_id": db_id,
                    "platform": "anilist",
                    "score": al_score,
                    "popularity": al_popularity
                }).execute()
                logger.info(f"AniList parsed score: {al_score}")

                if anomaly:
                    # Find rival matching ID
                    match = next((item for item in ANIME_TO_TRACK if item["anilist_id"] == anilist_id), None)
                    rival_id = match["rival_anilist_id"] if match else 21355
                    trigger_profile_sweep(db_id, anilist_id, rival_id, mal_id)
            delay_api()
        except Exception as e:
            logger.error(f"Failed to scrape AniList for ID {anilist_id}: {e}")

        # 2. MAL Jikan Data Fetch
        try:
            mal_data = fetch_jikan_metadata(mal_id)
            if mal_data:
                mal_score = float(mal_data.get("score", 8.0))
                mal_popularity = mal_data.get("members", 0)
                
                anomaly = detect_score_anomaly(db_id, "mal", mal_score)
                
                # Record snapshot
                supabase.table("score_snapshots").insert({
                    "anime_id": db_id,
                    "platform": "mal",
                    "score": mal_score,
                    "popularity": mal_popularity
                }).execute()
                logger.info(f"MAL parsed score: {mal_score}")
                
                if anomaly:
                    match = next((item for item in ANIME_TO_TRACK if item["mal_id"] == mal_id), None)
                    rival_id = match["rival_anilist_id"] if match else 21355
                    trigger_profile_sweep(db_id, anilist_id, rival_id, mal_id)
            delay_api()
        except Exception as e:
            logger.error(f"Failed to scrape MAL Jikan for ID {mal_id}: {e}")

        # 3. Kitsu Data Fetch
        try:
            kt_data = fetch_kitsu_metadata(kitsu_id)
            if kt_data:
                # Kitsu attributes.averageRating is out of 100 as a string, normalize
                raw_rating = kt_data.get("averageRating")
                kt_score = round(float(raw_rating) / 10.0, 2) if raw_rating else 8.0
                kt_pop = int(kt_data.get("userCount", 0))
                
                # Record snapshot
                supabase.table("score_snapshots").insert({
                    "anime_id": db_id,
                    "platform": "kitsu",
                    "score": kt_score,
                    "popularity": kt_pop
                }).execute()
                logger.info(f"Kitsu parsed score: {kt_score}")
            delay_api()
        except Exception as e:
            logger.error(f"Failed to scrape Kitsu for ID {kitsu_id}: {e}")

    logger.info("Platform score sweep operation complete.")

# =========================================================================
# CLI COMMAND ROUTER
# =========================================================================
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="FandomRates Engine Scraper Client")
    parser.add_argument("--seed", action="store_true", help="Populate tables with initial metadata, base-snapshots and battles configuration")
    parser.add_argument("--run", action="store_true", help="Perform real-time score scraper update sweep")
    parser.add_argument("--anime-id", type=int, help="Limit standard scraper execution strictly to a single database ID")
    
    args = parser.parse_args()
    
    if args.seed:
        seed_database()
    elif args.run:
        run_scraper(target_anime_id=args.anime_id)
    else:
        parser.print_help()
