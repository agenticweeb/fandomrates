#!/usr/bin/env python
import os
import sys
import re
import argparse
import time
import logging
from datetime import datetime, timezone, timedelta
import requests
from dotenv import load_dotenv
from supabase import create_client, Client
from tenacity import retry, stop_after_attempt, wait_exponential

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("fandomrates_scraper")

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    logger.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY variables.")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

ANIME_TO_TRACK = [
    {
        "id": 1,
        "anilist_id": 108511,
        "mal_id": 39535,
        "title_english": "Mushoku Tensei: Jobless Reincarnation"
    },
    {
        "id": 2,
        "anilist_id": 21355,
        "mal_id": 31240,
        "title_english": "Re:ZERO -Starting Life in Another World-"
    }
]

def delay_api(seconds=1.5):
    time.sleep(seconds)

# =========================================================================
# 1. ANILIST GRAPHQL ADAPTERS
# =========================================================================

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def fetch_anilist_season_visuals(anilist_id):
    """Fetch season coverImage and bannerImage from AniList."""
    query = """
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        coverImage { extraLarge large }
        bannerImage
      }
    }
    """
    url = "https://graphql.anilist.co"
    try:
        response = requests.post(url, json={"query": query, "variables": {"id": anilist_id}}, timeout=10)
        if response.status_code == 200:
            media = response.json().get("data", {}).get("Media", {})
            cover = media.get("coverImage", {}).get("extraLarge") or media.get("coverImage", {}).get("large")
            banner = media.get("bannerImage")
            return cover, banner
    except Exception as e:
        logger.error(f"Error fetching AniList visuals for {anilist_id}: {e}")
    return None, None

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def fetch_anilist_episode_thumbnails(anilist_id):
    """Fetch episode titles and thumbnails list from AniList."""
    query = """
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        streamingEpisodes {
          title
          thumbnail
        }
      }
    }
    """
    url = "https://graphql.anilist.co"
    try:
        response = requests.post(url, json={"query": query, "variables": {"id": anilist_id}}, timeout=10)
        if response.status_code == 200:
            return response.json().get("data", {}).get("Media", {}).get("streamingEpisodes", [])
    except Exception as e:
        logger.error(f"Error fetching AniList thumbnails for {anilist_id}: {e}")
    return []

# =========================================================================
# 2. MAL JIKAN METADATA ADAPTERS
# =========================================================================

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def fetch_jikan_episodes(mal_id, page=1):
    url = f"https://api.jikan.moe/v4/anime/{mal_id}/episodes?page={page}"
    response = requests.get(url, timeout=10)
    if response.status_code == 429:
        time.sleep(5)
        raise requests.RequestException("Rate Limit")
    response.raise_for_status()
    return response.json().get("data", [])

# =========================================================================
# 3. REVOLVING CRAWLER INTEGRATION
# =========================================================================

def parse_episode_number(title_str, index_fallback):
    """Extract integer episode digits using regex with sequential index fallbacks."""
    matches = re.findall(r'\d+', title_str)
    if matches:
        return int(matches[0])
    return index_fallback

def backfill_episodes_with_thumbnails(anime_id, season_db_id, mal_id, anilist_id):
    """Backfills schedule nodes and stitches AniList streaming thumbnails cleanly."""
    logger.info(f"Backfilling episodes and stitching thumbnails for MAL {mal_id}...")
    try:
        # 1. Fetch MAL schedules
        mal_eps = fetch_jikan_episodes(mal_id, page=1)
        
        # 2. Fetch AniList thumbnails
        al_streams = fetch_anilist_episode_thumbnails(anilist_id)
        
        # Build index map of thumbnails
        thumb_map = {}
        for idx, stream in enumerate(al_streams):
            title = stream.get("title") or ""
            ep_num = parse_episode_number(title, idx + 1)
            thumb_map[ep_num] = stream.get("thumbnail")

        for idx, ep in enumerate(mal_eps):
            ep_num = ep.get("mal_id") or (idx + 1)
            aired_raw = ep.get("aired")
            aired_date = None
            if aired_raw:
                aired_date = aired_raw.split("T")[0]

            # Match thumbnail
            thumb_url = thumb_map.get(ep_num)

            # Insert/Update logic
            existing = supabase.table("episodes") \
                .select("id") \
                .eq("season_id", season_db_id) \
                .eq("episode_number", ep_num) \
                .execute()

            if existing.data:
                # Update thumbnail property dynamically
                if thumb_url:
                    supabase.table("episodes").update({
                        "thumbnail_url": thumb_url,
                        "episode_title": ep.get("title") or f"Episode {ep_num}",
                        "aired_date": aired_date
                    }).eq("id", existing.data[0]["id"]).execute()
            else:
                supabase.table("episodes").insert({
                    "season_id": season_db_id,
                    "anime_id": anime_id,
                    "episode_number": ep_num,
                    "episode_title": ep.get("title") or f"Episode {ep_num}",
                    "aired_date": aired_date,
                    "thumbnail_url": thumb_url
                }).execute()
        delay_api()
    except Exception as e:
        logger.error(f"Error backfilling episodes for season MAL {mal_id}: {e}")

def seed_visual_database():
    """Wipes and seeds the entire multi-season database with live assets."""
    logger.info("Initializing high-fidelity seasonal seed with AniList visual mappings...")
    
    # Static season matrices containing verified identifiers to map cover designs
    seasons_catalog = {
        1: [ # Mushoku Tensei
            {"num": 1, "mal_id": 39535, "anilist_id": 108511, "title": "Season 1", "ep_count": 23, "start": "2021-01-11", "end": "2021-12-19"},
            {"num": 2, "mal_id": 54595, "anilist_id": 156822, "title": "Season 2", "ep_count": 25, "start": "2023-07-09", "end": "2024-06-30"},
            {"num": 3, "mal_id": 58312, "anilist_id": 175510, "title": "Season 3", "ep_count": 12, "start": "2026-07-05", "end": "2026-09-20"}
        ],
        2: [ # Re:Zero
            {"num": 1, "mal_id": 31240, "anilist_id": 21355, "title": "Season 1", "ep_count": 25, "start": "2016-04-04", "end": "2016-09-19"},
            {"num": 2, "mal_id": 39587, "anilist_id": 108630, "title": "Season 2", "ep_count": 25, "start": "2020-07-08", "end": "2021-03-24"},
            {"num": 3, "mal_id": 54857, "anilist_id": 165038, "title": "Season 3", "ep_count": 16, "start": "2024-10-02", "end": "2025-03-26"},
            {"num": 4, "mal_id": 59312, "anilist_id": 182310, "title": "Season 4", "ep_count": 12, "start": "2026-04-08", "end": "2026-06-24"}
        ]
    }

    for anime in ANIME_TO_TRACK:
        anime_id = anime["id"]
        seasons_list = seasons_catalog.get(anime_id, [])

        for s in seasons_list:
            # 1. Fetch images from AniList GraphQL
            cover_url, banner_url = fetch_anilist_season_visuals(s["anilist_id"])
            delay_api(0.5)

            # 2. Register/Update Season records
            existing = supabase.table("seasons").select("id").eq("mal_id", s["mal_id"]).execute()
            if existing.data:
                s_id = existing.data[0]["id"]
                supabase.table("seasons").update({
                    "cover_image_url": cover_url,
                    "banner_image_url": banner_url,
                    "title": s["title"],
                    "title_english": f"{anime['title_english']} {s['title']}"
                }).eq("id", s_id).execute()
                logger.info(f"Updated Season {s['num']} assets for ID {anime_id}")
            else:
                ins = supabase.table("seasons").insert({
                    "anime_id": anime_id,
                    "season_number": s["num"],
                    "mal_id": s["mal_id"],
                    "anilist_id": s["anilist_id"],
                    "title": s["title"],
                    "title_english": f"{anime['title_english']} {s['title']}",
                    "episode_count": s["ep_count"],
                    "start_date": s["start"],
                    "end_date": s["end"],
                    "cover_image_url": cover_url,
                    "banner_image_url": banner_url
                }).execute()
                s_id = ins.data[0]["id"]
                logger.info(f"Registered Season {s['num']} with cover assets for ID {anime_id}")

            # 3. Backfill episodes matching thumbnails
            backfill_episodes_with_thumbnails(
                anime_id=anime_id,
                season_db_id=s_id,
                mal_id=s["mal_id"],
                anilist_id=s["anilist_id"]
            )

    logger.info("Visual database seeding operations finalized.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="FandomRates Core Assets Engine")
    parser.add_argument("--seed", action="store_true", help="Execute structural tables visual mapping and backfill schedule thumbnails")
    args = parser.parse_args()

    if args.seed:
        seed_visual_database()
    else:
        parser.print_help()
