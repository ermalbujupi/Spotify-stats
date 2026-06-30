/**
 * Central Spotify/auth configuration.
 *
 * Reads server-side environment variables. The Client ID is, under PKCE,
 * safe to send to Spotify's authorize endpoint, but we still keep all of this
 * server-side and never ship tokens to the browser.
 */

/** OAuth scopes the app requests. Keep this list minimal — see Phase 0. */
export const SPOTIFY_SCOPES = [
  "user-read-private", // basic profile (display name, avatar)
  "user-top-read", // top artists & tracks
  "user-read-recently-played", // last 50 plays
  "user-library-read", // saved tracks / albums
  "user-follow-read", // followed artists
  "playlist-read-private", // private playlists
  "playlist-read-collaborative", // collaborative playlists
  "user-read-currently-playing", // optional "now playing"
] as const;

export const SPOTIFY_AUTHORIZE_URL = "https://accounts.spotify.com/authorize";
export const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
export const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

export interface SpotifyConfig {
  clientId: string;
  redirectUri: string;
  appUrl: string;
}

/**
 * Returns validated config, or throws a descriptive error listing what's
 * missing. Call this only from server routes/actions where the values are
 * required — not from rendering paths that should degrade gracefully.
 */
export function getSpotifyConfig(): SpotifyConfig {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://127.0.0.1:3000";

  const missing: string[] = [];
  if (!clientId) missing.push("SPOTIFY_CLIENT_ID");
  if (!redirectUri) missing.push("SPOTIFY_REDIRECT_URI");

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(
        ", ",
      )}. Copy .env.example to .env.local and fill them in.`,
    );
  }

  return { clientId: clientId!, redirectUri: redirectUri!, appUrl };
}

/** True when the minimal config needed to start the OAuth flow is present. */
export function isSpotifyConfigured(): boolean {
  return Boolean(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_REDIRECT_URI);
}
