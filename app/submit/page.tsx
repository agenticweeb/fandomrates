"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Anime } from '@/types';
import { motion } from 'framer-motion';

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

      if (insertError) throw insertError;

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
    <div className="max-w-3xl mx-auto space-y-8 py-12">
      <div className="space-y-3">
        <span className="inline-flex px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-accent-gold/10 text-accent-gold border border-accent-gold/20">
          ✦ Verified Community Audits
        </span>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-text-primary uppercase">
          Submit Sabotage Evidence
        </h1>
        <p className="text-sm text-text-secondary leading-relaxed">
          Found bot nets, burner coordination lists, or platform review bombs? Upload evidence links below. Verified entries appear on our audit log.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Form elements */}
        <div className="lg:col-span-8 border border-border rounded-2xl bg-surface p-6 md:p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(6,182,212,0.05),transparent_40%)] pointer-events-none" />
          
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {error && (
              <div className="p-4 rounded-lg bg-danger/10 border border-danger/20 text-xs text-danger font-bold font-mono">
                [ERROR] {error}
              </div>
            )}

            {success && (
              <div className="p-4 rounded-lg bg-success/10 border border-success/20 text-xs text-success font-bold font-mono">
                [SUCCESS] Submission successfully queued for validation.
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-secondary">Target Anime</label>
              <select
                value={selectedAnimeId}
                onChange={(e) => setSelectedAnimeId(e.target.value)}
                className="w-full rounded-lg border border-border bg-background p-3 text-sm font-semibold text-text-primary focus:outline-none focus:border-accent-cyan transition-colors"
              >
                {animeList.map((anime) => (
                  <option key={anime.id} value={anime.id}>
                    {anime.title_english || anime.title_romaji}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-secondary">Reporting Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full rounded-lg border border-border bg-background p-3 text-sm font-semibold text-text-primary focus:outline-none focus:border-accent-cyan transition-colors"
              >
                <option value="anilist">AniList</option>
                <option value="mal">MyAnimeList (MAL)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-secondary">Profile URL Link</label>
              <input
                type="url"
                required
                placeholder="e.g. https://myanimelist.net/profile/Username"
                value={profileUrl}
                onChange={(e) => setProfileUrl(e.target.value)}
                className="w-full rounded-lg border border-border bg-background p-3 text-sm font-mono text-text-primary focus:outline-none focus:border-accent-cyan transition-colors placeholder-text-secondary/20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-secondary">Audit Notes & Proof</label>
              <textarea
                rows={4}
                placeholder="Describe behavior: e.g. Created 2 days ago, rated Re:Zero 10/10 and Mushoku Tensei 1/10..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-border bg-background p-3 text-sm text-text-primary focus:outline-none focus:border-accent-cyan transition-colors placeholder-text-secondary/20 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-lg text-xs font-black uppercase tracking-wider bg-text-primary text-background hover:bg-text-primary/90 disabled:opacity-50 transition-colors shadow-lg shadow-text-primary/5"
            >
              {loading ? 'Processing Submission...' : 'Upload Evidence Link'}
            </button>
          </form>
        </div>

        {/* Audit sidebar info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-5 border border-border rounded-2xl bg-surface/30 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-accent-gold">What happens next?</h4>
            <div className="space-y-3 text-xs text-text-secondary leading-relaxed">
              <p>
                <strong className="text-text-primary block mb-1">1. Queue check:</strong>
                Submissions automatically queue for automated API checks.
              </p>
              <p>
                <strong className="text-text-primary block mb-1">2. Heuristics audit:</strong>
                Our crawlers extract account metadata and check completed lists for faction anomalies.
              </p>
              <p>
                <strong className="text-text-primary block mb-1">3. Live integration:</strong>
                Verified profiles appear inside the Coordinated activity logs, with anonymized identifiers.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
