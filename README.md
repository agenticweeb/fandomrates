<div align="center">
  <h1>FandomRates</h1>
  <p><strong>The Truth Behind Anime Rating Scores</strong></p>
  <p>A transparency tool for tracking anime ratings across platforms, detecting review bombing patterns, and verifying suspicious activity through public data analysis.</p>

  [![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
  [![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
  [![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python)](https://python.org/)
</div>

---

## What is FandomRates?

FandomRates tracks how anime shows perform across **AniList**, **MyAnimeList (MAL)**, and **Kitsu** — then surfaces anomalies that suggest coordinated review bombing or score inflation.

**First battle:** [Mushoku Tensei](https://anilist.co/anime/108511) vs [Re:Zero](https://anilist.co/anime/21355)

### Key Features

- **Cross-platform score tracking** — Aggregated scores from AniList, MAL, and Kitsu in one view
- **Anomaly detection** — Automatic flagging when scores drop or spike by ≥0.30 points
- **Episode timeline** — Score history mapped to episode air dates
- **Suspicious profile auditing** — Public profile analysis with anonymized evidence (rival fandom, burner, inflation)
- **Community submissions** — Fans can submit suspicious profile links for moderation
- **Full transparency** — Methodology page with raw algorithm, CSV data exports, and clear limitations

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14 (App Router) + TypeScript + Tailwind CSS | Dark-themed dashboard with ISR |
| **Charts** | Recharts + Framer Motion | Animated score charts and transitions |
| **Database** | Supabase (PostgreSQL) | Relational data with JSONB for evidence |
| **Scraper** | Python (httpx + tenacity + supabase-py) | Local API polling with rate-limit respect |
| **Deployment** | Vercel (Hobby tier) | Zero-config Next.js hosting |

---

## Project Structure

```
fandomrates/
├── app/                          # Next.js App Router
│   ├── battle/[slug]/page.tsx    # Dynamic battle arena (MT vs Re:Zero)
│   ├── anime/[id]/page.tsx       # Single anime detail
│   ├── methodology/page.tsx      # How detection works
│   ├── submit/page.tsx           # Community evidence form
│   ├── page.tsx                  # Dashboard (all battles)
│   └── layout.tsx                # Root layout + dark theme
├── components/                   # Reusable UI components
│   ├── ScoreChart.tsx
│   ├── EpisodeTimeline.tsx
│   ├── ProfileEvidence.tsx
│   ├── DataFreshnessBadge.tsx
│   ├── Navbar.tsx
│   └── Footer.tsx
├── lib/
│   └── supabase.ts               # Supabase client (reads from env)
├── types/
│   └── index.ts                  # Shared TypeScript interfaces
├── scraper.py                    # Python scraper (local execution)
├── requirements.txt              # Python dependencies
├── tsconfig.json                 # Path aliases (@/types, @/lib, @/components)
├── tailwind.config.ts            # Custom color palette (dark theme)
├── .env.example                  # Environment variable template
└── README.md                     # This file
```

---

## Database Schema

The project uses 7 PostgreSQL tables with Row Level Security (RLS) for public reads.

### Tables

| Table | Purpose |
|-------|---------|
| `anime` | Metadata for tracked shows (AniList/MAL/Kitsu IDs, titles, images) |
| `score_snapshots` | Weekly score data per platform per anime |
| `episode_scores` | Per-episode scores and air dates |
| `anomaly_events` | Detected score drops/spikes (≥0.30 delta) |
| `suspicious_profiles` | Anonymized flagged accounts with evidence JSONB |
| `community_submissions` | Fan-submitted evidence links (pending/verified/rejected) |
| `battles` | Dynamic battle pairs (anime_a vs anime_b) |

### Key Design Decisions

- **Anonymization:** Real usernames are stored in the DB but never displayed publicly. A trigger auto-generates `display_id` (e.g., `user_a7f3`) on insert.
- **RLS:** All tables allow `SELECT` for anonymous users. Only `community_submissions` allows `INSERT` from the public.
- **JSONB evidence:** The `suspicious_profiles.evidence` column stores arbitrary metadata (favorites, account age, score spread) without schema changes.

### Full SQL

Run this in your Supabase SQL Editor to initialize the database:

```sql
-- Base tables
CREATE TABLE anime (
    id SERIAL PRIMARY KEY,
    anilist_id INTEGER UNIQUE,
    mal_id INTEGER UNIQUE,
    kitsu_id INTEGER UNIQUE,
    title_english TEXT,
    title_romaji TEXT,
    cover_image_url TEXT,
    banner_image_url TEXT,
    synopsis TEXT,
    episodes INTEGER,
    status TEXT,
    season TEXT,
    season_year INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE score_snapshots (
    id SERIAL PRIMARY KEY,
    anime_id INTEGER REFERENCES anime(id) ON DELETE CASCADE,
    platform TEXT CHECK (platform IN ('anilist', 'mal', 'kitsu')),
    score DECIMAL(4,2),
    popularity INTEGER,
    scraped_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE episode_scores (
    id SERIAL PRIMARY KEY,
    anime_id INTEGER REFERENCES anime(id) ON DELETE CASCADE,
    platform TEXT CHECK (platform IN ('anilist', 'mal')),
    episode_number INTEGER,
    episode_title TEXT,
    air_date DATE,
    score DECIMAL(4,2),
    scraped_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE anomaly_events (
    id SERIAL PRIMARY KEY,
    anime_id INTEGER REFERENCES anime(id) ON DELETE CASCADE,
    platform TEXT,
    event_type TEXT CHECK (event_type IN ('drop', 'spike')),
    score_before DECIMAL(4,2),
    score_after DECIMAL(4,2),
    detected_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE suspicious_profiles (
    id SERIAL PRIMARY KEY,
    anime_id INTEGER REFERENCES anime(id) ON DELETE CASCADE,
    platform TEXT,
    username TEXT,
    platform_user_id TEXT,
    account_created_at TIMESTAMP,
    rating_given INTEGER CHECK (rating_given BETWEEN 1 AND 10),
    category TEXT CHECK (category IN ('rival_fandom', 'burner', 'inflation', 'unknown')),
    evidence JSONB,
    display_id TEXT UNIQUE,
    found_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE community_submissions (
    id SERIAL PRIMARY KEY,
    anime_id INTEGER REFERENCES anime(id) ON DELETE CASCADE,
    platform TEXT,
    profile_url TEXT,
    notes TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    submitted_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE battles (
    id SERIAL PRIMARY KEY,
    anime_a_id INTEGER REFERENCES anime(id) ON DELETE CASCADE,
    anime_b_id INTEGER REFERENCES anime(id) ON DELETE CASCADE,
    slug TEXT UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Auto-generate anonymized display_id
CREATE OR REPLACE FUNCTION generate_display_id() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.display_id IS NULL THEN
        NEW.display_id := 'user_' || substring(md5(NEW.username || now()::text), 1, 6);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_display_id
BEFORE INSERT ON suspicious_profiles
FOR EACH ROW
EXECUTE FUNCTION generate_display_id();

-- Row Level Security
ALTER TABLE anime ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE episode_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomaly_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspicious_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE battles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on anime" ON anime FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read on score_snapshots" ON score_snapshots FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read on episode_scores" ON episode_scores FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read on anomaly_events" ON anomaly_events FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read on suspicious_profiles" ON suspicious_profiles FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read on community_submissions" ON community_submissions FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read on battles" ON battles FOR SELECT TO public USING (true);
CREATE POLICY "Allow public inserts on submissions" ON community_submissions FOR INSERT TO public WITH CHECK (true);
```

---

## Local Setup

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- A [Supabase](https://supabase.com) account (free tier)

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/fandomrates.git
cd fandomrates

# Frontend dependencies
npm install

# Python dependencies
pip install -r requirements.txt
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
cp .env.example .env.local
```

Edit both files with your Supabase keys:
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` → `.env` (for the Python scraper)
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` → `.env.local` (for the Next.js frontend)

Get these from your Supabase project: **Settings → API**.

### 3. Apply Database Schema

1. Go to your Supabase project
2. Open **SQL Editor → New query**
3. Paste the full SQL schema above
4. Click **Run**
5. Verify: **Table Editor** should show all 7 tables

### 4. Seed Initial Data

Run the scraper to populate the database with your first battle:

```bash
python scraper.py --seed
```

This fetches Mushoku Tensei and Re:Zero metadata + current scores without triggering anomaly detection.

### 5. Start the Frontend

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6. Run the Scraper (Weekly)

```bash
python scraper.py --run
```

This pulls fresh scores, detects anomalies, and runs profile sweeps if drops/spikes are found.

---

## How the Scraper Works

```
For each tracked anime:
  1. Fetch scores from AniList (GraphQL), MAL (Jikan), Kitsu (JSON API)
  2. Store in score_snapshots
  3. Compare to previous snapshot
  4. If |delta| >= 0.30 → create anomaly_events row
  5. If anomaly detected → sweep 150 most recent public profiles
  6. Categorize each profile:
     - rival_fandom: has opposing anime in favorites + low score
     - burner: empty list + new account (<30 days)
     - inflation: 10/10 rating + empty list
     - unknown: insufficient data
  7. Store anonymized profiles in suspicious_profiles
```

**Rate limits respected:**
- AniList: ~90 req/min (unauthenticated)
- Jikan (MAL): 3 req/sec with `time.sleep(0.4)` between calls
- Tenacity handles exponential backoff on 429 errors

---

## Deployment (Vercel)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: FandomRates v1"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/fandomrates.git
git push -u origin main
```

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New Project"**
3. Import your `fandomrates` repository
4. Vercel auto-detects Next.js — leave all settings default
5. Add **Environment Variables** in the Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Click **Deploy**

Your site will be live at `https://fandomrates.vercel.app` (or your chosen subdomain).

### 3. Keep the Database Alive

Supabase free tier pauses projects after 7 days of inactivity. Since you run the scraper weekly, this is usually fine. For extra safety, you can add a GitHub Actions workflow that pings the database twice a week.

---

## Adding a New Battle

To track a new anime pair (e.g., Frieren vs Fullmetal Alchemist):

1. Find the AniList and MAL IDs for both anime
2. Insert into the `anime` table (or let the scraper auto-create them)
3. Insert into the `battles` table:
   ```sql
   INSERT INTO battles (anime_a_id, anime_b_id, slug, is_active)
   VALUES (3, 4, 'frieren-vs-fma', true);
   ```
4. Run the scraper: `python scraper.py --run`
5. The new battle appears automatically on the dashboard

No code changes needed. The frontend reads battles dynamically from the database.

---

## Methodology & Limitations

**What we can prove:**
- Score changes over time (public API data)
- Public profile correlations (favorites, score spreads, account age)
- Aggregate patterns ("12 accounts with Re:Zero favorites rated MT 1/10")

**What we cannot prove:**
- Intent (we show correlation, not causation)
- Private profiles (30-40% of users keep lists private)
- Burner accounts with no activity (no attribution possible)

**False positives exist.** Someone might genuinely dislike a show and also like its rival. That's why every flagged profile includes a confidence level and raw evidence — fans can judge for themselves.

See the full methodology at `/methodology` on the live site.

---

## Contributing

This is an open-source transparency project. Contributions welcome:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Acknowledgments

- Data sources: [AniList](https://anilist.co), [MyAnimeList](https://myanimelist.net) (via [Jikan](https://jikan.moe)), [Kitsu](https://kitsu.io)
- Built with [Next.js](https://nextjs.org), [Supabase](https://supabase.com), [Tailwind CSS](https://tailwindcss.com), and [Recharts](https://recharts.org)
- Inspired by the need for transparent, fan-first analytics in anime fandoms

---

<div align="center">
  <p><strong>FandomRates</strong> — Built by fans, for fans.</p>
  <p><em>"The truth behind the scores."</em></p>
</div>
