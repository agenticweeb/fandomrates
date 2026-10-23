import { Anime } from '@/types';

export const DECISION_LOG_KEY = 'fandomrates.watchlist.v1';
export type DecisionIntent = 'safe' | 'short' | 'wildcard';
export type DecisionOutcome = 'watched' | 'dropped';

export interface SavedTitle {
  anime: Pick<Anime, 'id' | 'title_english' | 'title_romaji' | 'cover_image_url'>;
  intent: DecisionIntent;
  outcome?: DecisionOutcome;
  savedAt: string;
  updatedAt: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isIntent(value: unknown): value is DecisionIntent {
  return value === 'safe' || value === 'short' || value === 'wildcard';
}

function isOutcome(value: unknown): value is DecisionOutcome {
  return value === 'watched' || value === 'dropped';
}

function isSavedTitle(value: unknown): value is SavedTitle {
  if (!isRecord(value) || !isRecord(value.anime)) return false;
  const anime = value.anime;
  return typeof anime.id === 'number' && Number.isFinite(anime.id) &&
    (typeof anime.title_english === 'string' || anime.title_english === null) &&
    (typeof anime.title_romaji === 'string' || anime.title_romaji === null) &&
    (typeof anime.cover_image_url === 'string' || anime.cover_image_url === null) &&
    isIntent(value.intent) && (value.outcome === undefined || isOutcome(value.outcome)) &&
    typeof value.savedAt === 'string' && typeof value.updatedAt === 'string';
}

export function readDecisionLog(): SavedTitle[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(DECISION_LOG_KEY) || '[]');
    const valid = Array.isArray(parsed) ? parsed.filter(isSavedTitle) : [];
    if (Array.isArray(parsed) && valid.length !== parsed.length) writeDecisionLog(valid);
    return valid;
  } catch {
    return [];
  }
}

export function writeDecisionLog(items: SavedTitle[]): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(DECISION_LOG_KEY, JSON.stringify(items));
    return true;
  } catch {
    return false;
  }
}

export function upsertDecision(item: SavedTitle): boolean {
  const current = readDecisionLog().filter((saved) => saved.anime.id !== item.anime.id);
  return writeDecisionLog([item, ...current]);
}

export function removeDecision(id: number): boolean {
  return writeDecisionLog(readDecisionLog().filter((item) => item.anime.id !== id));
}

export function downloadDecisionLog(items: SavedTitle[]): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `fandomrates-decisions-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
