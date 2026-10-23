"use client";

import { useState } from 'react';

export default function SubmitEvidencePage() {
  const [form, setForm] = useState({ show: '', platform: 'AniList', notes: '', sourceUrl: '' });
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setState('loading');
    setMessage('');
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          show: form.show.trim(),
          platform: form.platform,
          notes: `${form.notes.trim()}\nSource URL: ${form.sourceUrl.trim() || 'Not provided'}`,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to submit the request.');
      setState('success');
      setMessage('Request received privately. Please keep the returned case reference for follow-up.');
      setForm({ show: '', platform: 'AniList', notes: '', sourceUrl: '' });
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : 'Unable to submit the request.');
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10 py-12">
      <header className="space-y-3">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-accent-cyan">Private review queue</p>
        <h1 className="text-4xl font-black tracking-tight text-text-primary">Request a correction or source review</h1>
        <p className="text-sm leading-7 text-text-secondary">Send a source link and context when a title, score, timestamp, or data-status label looks wrong. This is a private review lead, not a public accusation channel. Do not submit private messages, personal information, or calls to target another person.</p>
      </header>
      <form onSubmit={submit} className="space-y-6 rounded-2xl border border-border bg-surface p-6 md:p-8">
        {message && <div role="status" className={`rounded-lg border p-4 text-sm ${state === 'error' ? 'border-danger/30 bg-danger/10 text-danger' : 'border-success/30 bg-success/10 text-success'}`}>{message}</div>}
        <label className="block space-y-2"><span className="text-xs font-black uppercase tracking-wider text-text-secondary">Anime title</span><input required maxLength={160} value={form.show} onChange={(e) => setForm({ ...form, show: e.target.value })} className="w-full rounded-lg border border-border bg-background p-3 text-sm text-text-primary outline-none focus-visible:outline-2 focus-visible:outline-accent-cyan" placeholder="e.g. Frieren: Beyond Journey’s End" /></label>
        <label className="block space-y-2"><span className="text-xs font-black uppercase tracking-wider text-text-secondary">Source or platform</span><select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} className="w-full rounded-lg border border-border bg-background p-3 text-sm text-text-primary outline-none focus-visible:outline-2 focus-visible:outline-accent-cyan"><option>AniList</option><option>MyAnimeList</option><option>Kitsu</option><option>Jikan</option><option>Other</option></select></label>
        <label className="block space-y-2"><span className="text-xs font-black uppercase tracking-wider text-text-secondary">Source URL (optional)</span><input type="url" maxLength={1000} value={form.sourceUrl} onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })} className="w-full rounded-lg border border-border bg-background p-3 text-sm text-text-primary outline-none focus-visible:outline-2 focus-visible:outline-accent-cyan" placeholder="https://..." /></label>
        <label className="block space-y-2"><span className="text-xs font-black uppercase tracking-wider text-text-secondary">What should be reviewed?</span><textarea required maxLength={3000} rows={7} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full resize-y rounded-lg border border-border bg-background p-3 text-sm leading-6 text-text-primary outline-none focus-visible:outline-2 focus-visible:outline-accent-cyan" placeholder="Describe the observable data issue and why the source link is relevant." /></label>
        <button type="submit" disabled={state === 'loading'} className="min-h-11 w-full rounded-lg bg-text-primary px-5 py-3 text-xs font-black uppercase tracking-wider text-background transition hover:bg-text-primary/90 disabled:opacity-50">{state === 'loading' ? 'Submitting privately…' : 'Submit private request'}</button>
      </form>
    </div>
  );
}
