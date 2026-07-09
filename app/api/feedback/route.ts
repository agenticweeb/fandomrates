import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { show, platform, notes } = await request.json();
    const webhookUrl = process.env.DISCORD_FEEDBACK_WEBHOOK;
    
    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'Discord feedback webhook is not configured on Vercel.' }, 
        { status: 500 }
      );
    }

    // Build rich, structured Discord layout
    const embed = {
      title: '📢 FandomRates — New Audit Campaign Request',
      description: 'A user has submitted a suggestion/feedback entry directly from your live dashboard.',
      color: 3447003, // Premium Cyan
      fields: [
        { name: 'Suggested Anime / Show', value: show || 'N/A', inline: true },
        { name: 'Target Platform', value: platform || 'N/A', inline: true },
        { name: 'Notes & Context', value: notes || 'No extra notes provided.' }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'FandomRates Security & Campaigns Router'
      }
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        embeds: [embed]
      })
    });

    if (!response.ok) {
      throw new Error(`Discord returned response status: ${response.status}`);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Feedback Dispatch Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to dispatch feedback.' }, { status: 500 });
  }
}
