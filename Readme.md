# Spotify Stats

A clean, modern, private dashboard for your personal Spotify listening statistics —
top artists, tracks, genres, eras, and inferred vibes.

Built with **Next.js (App Router) + TypeScript + Tailwind CSS v4**.

> **Status:** Phase 1 (Project Setup) complete. Authentication and live data
> arrive in later phases. See [Roadmap](#roadmap) below.

---

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

You don't need this yet for Phase 1, but here's what Phase 2 (auth) will require:

1. Go to the [Developer Dashboard](https://developer.spotify.com/dashboard) and
   **Create app**.
2. Set the **Redirect URI** to exactly:
   `http://127.0.0.1:3000/api/auth/callback`
3. Copy the **Client ID** into `SPOTIFY_CLIENT_ID` in `.env.local`.
4. Under **Users Management**, add yourself (and up to 4 others) by name +
   Spotify email. Development Mode is limited to **5 allowlisted users**.
5. Generate a session secret: `openssl rand -base64 32` → `SESSION_SECRET`.

We use the **Authorization Code + PKCE** flow handled in server-side route
handlers. Tokens are stored in **httpOnly, Secure cookies** and never exposed to
client-side JavaScript. The client secret is **not** required.

## Scripts

| Command            | Description                              |
| ------------------ | ---------------------------------------- |
| `npm run dev`      | Start the dev server                     |
| `npm run build`    | Production build                         |
| `npm run start`    | Serve the production build               |
| `npm run lint`     | Run Next.js lint                         |
| `npm run typecheck`| Type-check without emitting              |

## Project structure

```
src/
  app/
    layout.tsx          Root layout + fonts + global styles
    page.tsx            Landing page
    globals.css         Tailwind v4 import + design tokens
    dashboard/
      page.tsx          Dashboard layout shell (placeholder)
  components/
    brand/Wordmark.tsx
    layout/Container.tsx
    ui/Card.tsx
```

Planned layering (kept strictly separated):

- `src/lib/spotify/` — typed Spotify API client (fetching only) — _Phase 3_
- `src/lib/insights/` — pure stat-calculation functions — _Phase 5_
- `src/app/api/auth/*` — OAuth route handlers — _Phase 2_

## Privacy

This app reads your Spotify data to display your stats. It requests only the
scopes needed (top items, recently played, library, playlists). Tokens live in a
server-side session cookie for your browser session. No listening data is sent to
any third party.

## Spotify API notes / limitations

Spotify removed several endpoints and fields in 2024–2026 that older "Spotify
stats" apps relied on. This project is designed around what's actually available:

- ❌ No audio features / audio analysis (no danceability/energy/valence)
- ❌ No `popularity` or `follower` fields (no true mainstream-vs-niche metric)
- ❌ No recommendations / related artists / featured playlists
- ⚠️ Recently-played history is capped at the **last 50 plays**
- ✅ Top artists/tracks (3 time ranges), genres, library, playlists, eras

"Vibe" and "discovery" insights are therefore **approximations** inferred from
genres, names, and metadata — clearly labeled as such in the UI and code.

## Roadmap

- [x] **Phase 0** — Spotify API research & technical plan
- [x] **Phase 1** — Project setup (this)
- [ ] **Phase 2** — Spotify authentication (PKCE)
- [ ] **Phase 3** — Data-fetching layer
- [ ] **Phase 4** — Basic dashboard
- [ ] **Phase 5** — Insight engine
- [ ] **Phase 6** — Advanced visualizations
- [ ] **Phase 7** — Time-range support
- [ ] **Phase 8** — Polish & UX
- [ ] **Phase 9** — Optional persistence

---

Not affiliated with Spotify. For personal use.
