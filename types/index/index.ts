
export interface Anime {
  id: number;
  anilist_id: number | null;
  mal_id: number | null;
  kitsu_id: number | null;
  title_english: string | null;
  title_romaji: string | null;
  cover_image_url: string | null;
  banner_image_url: string | null;
  synopsis: string | null;
  episodes: number | null;
  status: string | null;
  season: string | null;
  season_year: number | null;
  created_at: string;
}

export interface ScoreSnapshot {
  id: number;
  anime_id: number;
  platform: 'anilist' | 'mal' | 'kitsu';
  score: number;
  popularity: number;
  scraped_at: string;
}

export interface EpisodeScore {
  id: number;
  anime_id: number;
  platform: 'anilist' | 'mal';
  episode_number: number;
  episode_title: string | null;
  air_date: string | null;
  score: number | null;
  scraped_at: string;
}

export interface AnomalyEvent {
  id: number;
  anime_id: number;
  platform: string;
  event_type: 'drop' | 'spike';
  score_before: number;
  score_after: number;
  detected_at: string;
}

export interface SuspiciousProfile {
  id: number;
  anime_id: number;
  platform: string;
  username: string;
  platform_user_id: string;
  account_created_at: string | null;
  rating_given: number;
  category: 'rival_fandom' | 'burner' | 'inflation' | 'unknown';
  evidence: {
    favorites: string[];
    list_count: number;
    mean_score: number;
    account_age_days: number;
    rating_given: number;
  };
  display_id: string;
  found_at: string;
}

export interface CommunitySubmission {
  id: number;
  anime_id: number;
  platform: string;
  profile_url: string;
  notes: string | null;
  status: 'pending' | 'verified' | 'rejected';
  submitted_at: string;
}

export interface Battle {
  id: number;
  anime_a_id: number;
  anime_b_id: number;
  slug: string;
  is_active: boolean;
  created_at: string;
  anime_a?: Anime;
  anime_b?: Anime;
}
