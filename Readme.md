# Spotify Stats

A clean, modern, private dashboard for your personal Spotify listening statistics —
top artists & tracks, eras, listening patterns, and inferred vibes, with a
"music personality" summary and local long-term history.

Built with **Next.js (App Router) + TypeScript + Tailwind CSS v4**.

> **Status:** Feature-complete (Phases 0–9). See [Roadmap](#roadmap).

---

## Features

- **Top artists & tracks** with artwork, across three time ranges (4 weeks /
  6 months / 12 months)
- **Recently played** timeline (your last ~50 plays)
- **Eras & decades** breakdown from album release dates
- **Listening clock** — a 24-hour radial chart of when you listen
- **On repeat** — tracks you've replayed recently
- **Taste diversity** and **discovery vs. comfort** scores
- **Inferred vibes** (radar chart) + a playful **music personality** card
- **Library & playlist** summary
- **History & trends** — optional, local-only snapshots that build long-term
  trends over time (see [Privacy](#privacy))

All charts are hand-rolled SVG (no charting dependency) and server-rendered.

## Requirements

- **Node.js 18.18+** (Node 24 recommended)
- A **Spotify Premium** account (required for Spotify Developer apps in
  Development Mode as of Feb 2026)
- A Spotify app registered in the
  [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Create your local env file
cp .env.example .env.local
# (fill in values — see "Spotify app setup" below)

# 3. Run the dev server
npm run dev
```

Then open **http://127.0.0.1:3000**.

> Use `127.0.0.1`, **not** `localhost` — Spotify no longer accepts `localhost`
> redirect URIs, so we standardize on the loopback IP everywhere.

## Spotify app setup

1. Go to the [Developer Dashboard](https://developer.spotify.com/dashboard) and
   **Create app**.
2. Set the **Redirect URI** to exactly:
   `http://127.0.0.1:3000/api/auth/callback`
3. Copy the **Client ID** into `SPOTIFY_CLIENT_ID` in `.env.local`.
4. Under **Users Management**, add yourself (and up to 4 others) by name +
   Spotify email. Development Mode is limited to **5 allowlisted users**.
5. Generate a session secret: `openssl rand -base64 32` → `SESSION_SECRET`.

We use the **Authorization Code + PKCE** flow handled in server-side route
handlers. Tokens are stored in **encrypted, httpOnly cookies** and never exposed
to client-side JavaScript. The client secret is **not** required.

## Scripts

| Command            | Description                              |
| ------------------ | ---------------------------------------- |
| `npm run dev`      | Start the dev server                     |
| `npm run build`    | Production build                         |
| `npm run start`    | Serve the production build               |
| `npm run lint`     | Run Next.js lint                         |
| `npm run typecheck`| Type-check without emitting              |

## Architecture

Concerns are kept strictly separated — API fetching, insight calculation, and UI
never bleed into each other:

```
src/
  app/
    page.tsx                 Landing page
    globals.css              Tailwind v4 tokens + animations
    dashboard/page.tsx       Dashboard (Server Component)
    dashboard/loading.tsx    Route-level skeleton
    api/auth/*/route.ts      OAuth: login, callback, refresh, logout
  components/
    auth/                    ConnectButton, ProfileCard
    dashboard/               Panels, charts, history (SVG + client bits)
    ui/                      Card, CoverImage, InfoHint, Skeleton, ...
  lib/
    auth/                    PKCE, AES-GCM cookie crypto, session, tokens
    spotify/                 Typed client, models, per-section aggregator
    insights/                Pure stat functions (genre-free):
                             eras, diversity, discovery, patterns, vibes,
                             personality, timeline, library
    history/                 Local IndexedDB snapshots (Phase 9)
    format.ts, timeRange.ts  Shared helpers
```

- **Fetching only** lives in `lib/spotify/` — typed, with rate-limit retry and
  pagination.
- **Insight calculations** are pure functions in `lib/insights/`, independently
  testable and free of any fetching.
- **Time range** is driven by a `?range=` URL param, so the Server Component
  re-fetches and re-derives everything for the chosen window.

## Privacy

This app reads your Spotify data (read-only scopes) purely to display your stats:

- **Tokens** live only in an **encrypted, httpOnly cookie** for your browser
  session — never in client JS, never on a server. Log out to clear it.
- **Listening data** is fetched fresh on each visit and never sent to any third
  party.
- **Local history:** to build long-term trends (which Spotify's API can't
  provide), the app saves a small **daily snapshot** of your stats in your
  browser's **IndexedDB**. This never leaves your device and can be wiped anytime
  via **Clear local history** in the History & trends panel.

## Spotify API notes / limitations

Spotify removed several endpoints and fields in 2024–2026 that older "Spotify
stats" apps relied on. This project is designed around what's actually available:

- ❌ No audio features / audio analysis (no danceability/energy/valence)
- ❌ No `popularity` or `follower` fields (no true mainstream-vs-niche metric)
- ❌ No recommendations / related artists / featured playlists
- ⚠️ **Genres come back empty** for essentially all artists (a known Spotify-wide
  regression) — so the insight engine is **genre-independent**; genres are shown
  only if an artist happens to have them
- ⚠️ Recently-played history is capped at the **last 50 plays**
- ✅ Top artists/tracks (3 time ranges), release dates/eras, library, playlists

Because of this, **"vibe" and "discovery" insights are approximations** inferred
from playlist/track names, release era, and listening time — and are clearly
labeled as such in the UI (info tooltips) and code comments.

## Roadmap

- [x] **Phase 0** — Spotify API research & technical plan
- [x] **Phase 1** — Project setup
- [x] **Phase 2** — Spotify authentication (PKCE)
- [x] **Phase 3** — Data-fetching layer
- [x] **Phase 4** — Basic dashboard
- [x] **Phase 5** — Insight engine (genre-independent)
- [x] **Phase 6** — Advanced visualizations (SVG)
- [x] **Phase 7** — Time-range support
- [x] **Phase 8** — Polish & UX
- [x] **Phase 9** — Optional persistence (local IndexedDB)

---

Not affiliated with Spotify. For personal use.
