"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Anime } from '@/types';

export default function SubmitEvidencePage() {
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [selectedAnimeId, setSelectedAnimeId] = useState<string>('');
  const [platform, setPlatform] = useState<string>('anilist');
  const [profileUrl, setProfileUrl] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Suggested Show Form states (Discord Webhook target)
  const [suggestShow, setSuggestShow] = useState<string>('');
  const [suggestPlatform, setSuggestPlatform] = useState<string>('MyAnimeList');
  const [suggestNotes, setSuggestNotes] = useState<string>('');
  const [suggestLoading, setSuggestLoading] = useState<boolean>(false);
  const [suggestSuccess, setSuggestSuccess] = useState<boolean>(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAnime() {
      const { data } = await supabase.from('anime').select('*');
      if (data) {
        setAnimeList(data);
        if (data.length > 0) setSelectedAnimeId(data[0].id.toString());
      }
    }
    loadAnime();
  }, []);

  const handleSubmitEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (!profileUrl.trim()) {
      setError('A profile URL is required to submit.');
      setLoading(false);
      return;
    }

    try {
      const { error: insertError } = await supabase
        .from('community_submissions')
        .insert({
          anime_id: parseInt(selectedAnimeId),
          platform,
          profile_url: profileUrl,
          notes: notes.trim() || null,
        });

      if (insertError) throw insertError;

      // Dispatch real-time alert to Discord [14]
      const animeName = animeList.find(a => a.id.toString() === selectedAnimeId)?.title_english || 'Tracked Campaign';
      try {
        await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            show: `[EVIDENCE] ${animeName}`,
            platform: platform.toUpperCase(),
            notes: `Flagged Suspect: ${profileUrl}\nNotes: ${notes.trim() || 'None'}`
          })
        });
      } catch (discordErr) {
         console.warn('Webhook delivery delayed:', discordErr);
      }

      setSuccess(true);
      setProfileUrl('');
      setNotes('');
    } catch (err: any) {
      setError(err.message || 'An error occurred during submission.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuggestLoading(true);
    setSuggestError(null);
    setSuggestSuccess(false);

    if (!suggestShow.trim()) {
      setSuggestError('A show title is required.');
      setSuggestLoading(false);
      return;
    }

    try {
      // POST directly to Next.js API handler
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          show: suggestShow.trim(),
          platform: suggestPlatform,
          notes: suggestNotes.trim() || 'No additional notes provided.'
        })
      });

      if (!res.ok) {
        throw new Error('Failed to dispatch recommendation.');
      }

      setSuggestSuccess(true);
      setSuggestShow('');
      setSuggestNotes('');
    } catch (err: any) {
      setSuggestError(err.message || 'An issue occurred sending suggestions.');
    } finally {
      setSuggestLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-12 px-4 sm:px-6">
      <div className="space-y-3 text-center md:text-left">
        <span className="inline-flex px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-accent-gold/10 text-accent-gold border border-accent-gold/20">
          ✦ Verified Community Audits
        </span>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-text-primary uppercase">
          Campaign Reports & Suggestion Hub
        </h1>
        <p className="text-sm text-text-secondary leading-relaxed max-w-2xl">
          Report active bot nets or suggest new anime databases to investigate. Real-time requests are forwarded directly to our Discord moderation team [14].
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* Form 1: Report Suspect Profiles */}
        <div className="border border-border rounded-2xl bg-surface p-6 md:p-8 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(239,68,68,0.03),transparent_40%)] pointer-events-none" />
          
          <div className="space-y-6 relative z-10">
            <div>
              <h3 className="text-lg font-black uppercase tracking-wider text-text-primary">1. Report Coordinated Abuse</h3>
              <p className="text-xs text-text-secondary mt-1">Submit links to suspicious platform burners or rival fandom stans [14].</p>
            </div>

            <form onSubmit={handleSubmitEvidence} className="space-y-5">
              {error && <div className="p-3.5 rounded-lg bg-danger/10 border border-danger/25 text-xs text-danger font-mono font-bold">[ERROR] {error}</div>}
              {success && <div className="p-3.5 rounded-lg bg-success/10 border border-success/25 text-xs text-success font-mono font-bold">[SUCCESS] Evidence logged and dispatched to Discord.</div>}

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Target Anime</label>
                <select
                  value={selectedAnimeId}
                  onChange={(e) => setSelectedAnimeId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background p-3 text-xs font-semibold text-text-primary focus:outline-none"
                >
                  {animeList.map((anime) => (
                    <option key={anime.id} value={anime.id}>
                      {anime.title_english || anime.title_romaji}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Reporting Site</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background p-3 text-xs font-semibold text-text-primary focus:outline-none"
                >
                  <option value="anilist">AniList</option>
                  <option value="mal">MyAnimeList (MAL)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Profile URL Link</label>
                <input
                  type="url"
                  required
                  placeholder="https://myanimelist.net/profile/Username"
                  value={profileUrl}
                  onChange={(e) => setProfileUrl(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background p-3 text-xs font-mono text-text-primary focus:outline-none placeholder-text-secondary/10"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Audit notes</label>
                <textarea
                  rows={4}
                  placeholder="Describe behavior..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background p-3 text-xs text-text-primary focus:outline-none placeholder-text-secondary/10 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-lg text-xs font-black uppercase tracking-wider bg-text-primary text-background hover:bg-text-primary/95 transition-all disabled:opacity-50"
              >
                {loading ? 'Logging Entry...' : 'Upload Evidence Link'}
              </button>
            </form>
          </div>
        </div>

        {/* Form 2: Talk to us / Request campaign (Discord Webhook interface) */}
        <div className="border border-border rounded-2xl bg-surface p-6 md:p-8 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(6,182,212,0.03),transparent_40%)] pointer-events-none" />
          
          <div className="space-y-6 relative z-10">
            <div>
              <h3 className="text-lg font-black uppercase tracking-wider text-text-primary">2. Talk to us / Request Audit</h3>
              <p className="text-xs text-text-secondary mt-1">Which show should we investigate next? Recommend active campaigns directly to Discord [14].</p>
            </div>

            <form onSubmit={handleSendSuggestion} className="space-y-5">
              {suggestError && <div className="p-3.5 rounded-lg bg-danger/10 border border-danger/25 text-xs text-danger font-mono font-bold">[ERROR] {suggestError}</div>}
              {suggestSuccess && <div className="p-3.5 rounded-lg bg-success/10 border border-success/25 text-xs text-success font-mono font-bold">[SUCCESS] Recommendation sent directly to Discord!</div>}

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Anime / Franchise Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Frieren: Beyond Journey's End"
                  value={suggestShow}
                  onChange={(e) => setSuggestShow(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background p-3 text-xs font-semibold text-text-primary focus:outline-none placeholder-text-secondary/10"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Platform Context</label>
                <select
                  value={suggestPlatform}
                  onChange={(e) => setSuggestPlatform(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background p-3 text-xs font-semibold text-text-primary focus:outline-none"
                >
                  <option value="MyAnimeList">MyAnimeList (MAL)</option>
                  <option value="AniList">AniList</option>
                  <option value="IMDb">IMDb</option>
                  <option value="All Platforms">All of Them</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Notes & Why We Should Investigate</label>
                <textarea
                  rows={6}
                  placeholder="e.g. Score dropped 0.40 in 2 hours after Episode 12 aired. Hundreds of 1/10 reviews with 0 finished shows..."
                  value={suggestNotes}
                  onChange={(e) => setSuggestNotes(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background p-3 text-xs text-text-primary focus:outline-none placeholder-text-secondary/10 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={suggestLoading}
                className="w-full py-3.5 rounded-lg text-xs font-black uppercase tracking-wider bg-text-primary text-background hover:bg-text-primary/95 transition-all disabled:opacity-50"
              >
                {suggestLoading ? 'Sending Alerts...' : 'Request Campaign Audit 📢'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
