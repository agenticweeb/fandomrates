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

  const handleSubmit = async (e: React.FormEvent) => {
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

      if (insertError) {
        throw insertError;
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

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">Submit Coordinated Campaigns</h1>
        <p className="text-sm text-text-secondary">
          Found suspicious accounts or review bombers on platform feeds? Drop the user profile URL below. Our system moderators will verify the submission.
        </p>
      </div>

      <div className="border border-border rounded-2xl bg-surface p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 rounded-lg bg-danger/10 border border-danger/20 text-xs text-danger font-medium">
              Error: {error}
            </div>
          )}

          {success && (
            <div className="p-4 rounded-lg bg-success/10 border border-success/20 text-xs text-success font-medium">
              Thank you! Your evidence has been uploaded successfully and queued for inspection.
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Target Anime</label>
            <select
              value={selectedAnimeId}
              onChange={(e) => setSelectedAnimeId(e.target.value)}
              className="w-full rounded-lg border border-border bg-background p-3 text-sm text-text-primary focus:outline-none focus:border-accent-cyan"
            >
              {animeList.map((anime) => (
                <option key={anime.id} value={anime.id}>
                  {anime.title_english || anime.title_romaji}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Reporting Platform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full rounded-lg border border-border bg-background p-3 text-sm text-text-primary focus:outline-none focus:border-accent-cyan"
            >
              <option value="anilist">AniList</option>
              <option value="mal">MyAnimeList (MAL)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Suspicious User Profile Link</label>
            <input
              type="url"
              required
              placeholder="e.g. https://anilist.co/user/Username"
              value={profileUrl}
              onChange={(e) => setProfileUrl(e.target.value)}
              className="w-full rounded-lg border border-border bg-background p-3 text-sm text-text-primary focus:outline-none focus:border-accent-cyan placeholder-text-secondary/30"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Notes & Auditable Context (Optional)</label>
            <textarea
              rows={4}
              placeholder="e.g. Account created 2 hours ago. Downvoted 10 episodes in 1 minute."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-border bg-background p-3 text-sm text-text-primary focus:outline-none focus:border-accent-cyan placeholder-text-secondary/30 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg text-sm font-bold bg-text-primary text-background hover:bg-text-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Submitting...' : 'Upload Evidence Link'}
          </button>
        </form>
      </div>
    </div>
  );
}
