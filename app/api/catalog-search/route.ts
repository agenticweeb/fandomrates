import { NextResponse } from 'next/server';

export const runtime = 'edge';

const ANILIST_QUERY = `
  query ($search: String) {
    Page(page: 1, perPage: 8) {
      media(search: $search, type: ANIME, isAdult: false, sort: SEARCH_MATCH) {
        id
        averageScore
        popularity
        title { english romaji native }
        coverImage { medium }
      }
    }
  }
`;

export async function GET(request: Request) {
  const value = new URL(request.url).searchParams.get('q')?.trim().slice(0, 100) || '';
  if (value.length < 2) return NextResponse.json({ results: [] });

  try {
    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ query: ANILIST_QUERY, variables: { search: value } }),
      cache: 'no-store',
    });
    if (!response.ok) return NextResponse.json({ results: [], unavailable: true }, { status: 200, headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } });
    const payload = await response.json() as { data?: { Page?: { media?: Array<{ id: number; averageScore: number | null; popularity: number | null; title: { english: string | null; romaji: string | null; native: string | null }; coverImage: { medium: string | null } | null }> } }; errors?: unknown[] };
    if (payload.errors || !payload.data?.Page?.media) return NextResponse.json({ results: [], unavailable: true });

    return NextResponse.json({
      results: payload.data.Page.media.map((media) => ({
        source: 'AniList',
        sourceId: media.id,
        title: media.title.english || media.title.romaji || media.title.native || 'Untitled anime',
        alternateTitle: media.title.romaji || media.title.native,
        score: media.averageScore === null ? null : media.averageScore / 10,
        popularity: media.popularity,
        coverImageUrl: media.coverImage?.medium || null,
        sourceUrl: `https://anilist.co/anime/${media.id}`,
      })),
      unavailable: false,
    }, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } });
  } catch {
    return NextResponse.json({ results: [], unavailable: true });
  }
}
