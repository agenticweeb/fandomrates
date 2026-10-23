import { NextResponse } from 'next/server';

const ALLOWED_PLATFORMS = new Set(['AniList', 'MyAnimeList', 'Kitsu', 'Jikan', 'Other']);
const MAX_SHOW = 160;
const MAX_NOTES = 3500;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const show = typeof body.show === 'string' ? body.show.trim() : '';
    const platform = typeof body.platform === 'string' ? body.platform.trim() : '';
    const notes = typeof body.notes === 'string' ? body.notes.trim() : '';
    if (!show || show.length > MAX_SHOW) return NextResponse.json({ error: 'Provide an anime title under 160 characters.' }, { status: 400 });
    if (!ALLOWED_PLATFORMS.has(platform)) return NextResponse.json({ error: 'Choose a supported source.' }, { status: 400 });
    if (!notes || notes.length > MAX_NOTES) return NextResponse.json({ error: 'Provide a review description under 3500 characters.' }, { status: 400 });

    const webhookUrl = process.env.DISCORD_FEEDBACK_WEBHOOK;
    if (!webhookUrl) return NextResponse.json({ error: 'Private review intake is temporarily unavailable. Please try again later.' }, { status: 503 });

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: 'FandomRates private correction request',
          description: 'Review this lead as unverified input. Do not publish identifiers or mobilize users.',
          color: 3447003,
          fields: [
            { name: 'Anime', value: show, inline: true },
            { name: 'Source', value: platform, inline: true },
            { name: 'Details', value: notes },
          ],
          timestamp: new Date().toISOString(),
        }],
      }),
    });
    if (!response.ok) return NextResponse.json({ error: 'The private review queue could not accept this request.' }, { status: 502 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
}
