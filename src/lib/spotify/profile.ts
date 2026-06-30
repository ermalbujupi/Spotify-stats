import { SPOTIFY_API_BASE } from "./config";

/**
 * Minimal current-user profile fetch for Phase 2.
 *
 * Note: as of the Feb 2026 API changes, `GET /me` no longer returns
 * `country`, `email`, `product`, or `followers` for development-mode apps, so
 * we model only the fields that are reliably present.
 */

export interface SpotifyImage {
  url: string;
  height: number | null;
  width: number | null;
}

export interface SpotifyUserProfile {
  id: string;
  display_name: string | null;
  images?: SpotifyImage[];
  external_urls?: { spotify?: string };
  uri?: string;
}

/** Sentinel thrown when the access token is rejected (expired/invalid). */
export class SpotifyAuthError extends Error {
  constructor(message = "Spotify access token is invalid or expired.") {
    super(message);
    this.name = "SpotifyAuthError";
  }
}

export async function fetchProfile(
  accessToken: string,
): Promise<SpotifyUserProfile> {
  const res = await fetch(`${SPOTIFY_API_BASE}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (res.status === 401) {
    throw new SpotifyAuthError();
  }
  if (!res.ok) {
    throw new Error(`Failed to load Spotify profile (${res.status}).`);
  }

  return (await res.json()) as SpotifyUserProfile;
}
