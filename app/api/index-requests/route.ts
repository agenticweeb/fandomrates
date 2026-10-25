import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const ANILIST_LOOKUP = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      type
      isAdult
      title { english romaji native }
      siteUrl
    }
  }
`;

type AniListLookup = {
  data?: { Media?: { id: number; type: string; isAdult: boolean; title: { english: string | null; romaji: string | null; native: string | null }; siteUrl: string | null } | null };
  errors?: unknown[];
};

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const body = await request.json() as { provider?: unknown; providerId?: unknown };
    if (body.provider !== 'anilist' || !/^[0-9]{1,12}$/.test(String(body.providerId || ''))) {
      return NextResponse.json({ error: 'Choose a valid AniList title before requesting indexing.' }, { status: 400 });
    }

    const providerId = Number(body.providerId);
    const lookup = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ query: ANILIST_LOOKUP, variables: { id: providerId } }),
      cache: 'no-store',
    });
    if (!lookup.ok) return NextResponse.json({ error: 'AniList could not verify this title. Try again later.' }, { status: 502 });
    const payload = await lookup.json() as AniListLookup;
    const media = payload.data?.Media;
    if (payload.errors || !media || media.type !== 'ANIME' || media.isAdult) {
      return NextResponse.json({ error: 'This AniList title could not be accepted for indexing.' }, { status: 422 });
    }

    const title = media.title.english || media.title.romaji || media.title.native || 'Untitled anime';
    const providerUrl = `https://anilist.co/anime/${media.id}`;
    const { data, error } = await supabase.rpc('enqueue_index_request', {
      p_provider: 'anilist',
      p_provider_id: String(media.id),
      p_requested_title: title.slice(0, 160),
      p_provider_url: providerUrl,
    });
    if (error) {
      console.error('FandomRates index request enqueue failed', error);
      return NextResponse.json({ error: 'Indexing is not configured yet. Apply the index-request migration, then try again.' }, { status: 503 });
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (row?.request_status === 'accepted' && row.anime_id) {
      return NextResponse.json({ status: 'already_indexed', animeId: row.anime_id });
    }
    return NextResponse.json({ status: 'queued', requestId: row?.request_id || null, title }, { status: 202 });
  } catch (error) {
    console.error('FandomRates index request invalid', error);
    return NextResponse.json({ error: 'Invalid indexing request.' }, { status: 400 });
  }
}
