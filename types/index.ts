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

export interface Season {
  id: number;
  anime_id: number;
  season_number: number;
  anilist_ids: number[] | null;
  mal_ids: number[] | null;
  title: string | null;
  title_english: string | null;
  title_romaji: string | null;
  episode_count: number | null;
  start_date: string | null;
  end_date: string | null;
  cover_image_url: string | null;
  banner_image_url: string | null;
  created_at: string;
}

export interface Episode {
  id: number;
  season_id: number;
  anime_id: number;
  episode_number: number;
  episode_title: string | null;
  aired_date: string | null;
  thumbnail_url: string | null;
  created_at: string;
  rating: number | null;     // Mapped to episodes.rating
  vote_count: number | null; // Mapped to episodes.vote_count
}

export interface Review {
  id: number;
  anime_id: number;
  season_id: number | null;
  episode_id: number | null;
  platform: string;
  username: string | null;
  display_id: string | null;
  score: number | null;
  review_text: string | null;
  review_date: string | null;
  helpful_count: number | null;
  category: 'bomber' | 'inflator' | 'genuine' | 'unknown';
  evidence: Record<string, any> | null;
  created_at: string;
}

export interface ScoreSnapshot {
  id: number;
  anime_id: number;
  platform: 'anilist' | 'mal' | 'kitsu';
  score: number | null;
  popularity: number | null;
  scraped_at: string;
}

export interface EpisodeScore {
  id: number;
  anime_id: number;
  platform: 'anilist' | 'mal';
  episode_number: number | null;
  episode_title: string | null;
  air_date: string | null;
  score: number | null;
  scraped_at: string;
  season_number: number | null;
  season_id: number | null;
  episode_id: number | null;
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
  username: string | null;
  platform_user_id: string | null;
  account_created_at: string | null;
  rating_given: number | null;
  category: 'rival_fandom' | 'burner' | 'inflation' | 'unknown';
  evidence: Record<string, any> | null;
  display_id: string | null;
  found_at: string;
}

export interface CommunitySubmission {
  id: number;
  anime_id: number;
  platform: string;
  profile_url: string | null;
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
