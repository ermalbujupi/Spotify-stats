import { SPOTIFY_API_BASE } from "./config";
import {
  SpotifyApiError,
  SpotifyAuthError,
  SpotifyRateLimitError,
  SpotifyScopeError,
} from "./errors";
import type {
  Artist,
  CursorPaging,
  FollowedArtistsResponse,
  Paging,
  PlayHistory,
  SavedTrack,
  SimplifiedPlaylist,
  SpotifyUserProfile,
  TimeRange,
  Track,
} from "./types";

/**
 * Low-level Spotify API client.
 *
 * Responsibilities (fetching only — no insight logic):
 *   - attach the bearer token
 *   - translate HTTP errors into typed errors (401/403/429/other)
 *   - retry politely on 429 using Retry-After, with a hard cap
 *   - follow offset/cursor pagination up to a caller-provided ceiling
 *
 * Token refresh is intentionally NOT handled here. Server Components can't write
 * cookies, so pages refresh proactively (see isExpired) or react to a thrown
 * SpotifyAuthError by redirecting to /api/auth/refresh.
 */

const MAX_RETRIES = 2;
const MAX_RETRY_WAIT_MS = 8_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Normalize an artist so downstream code can trust the shape. In practice
 * Spotify often returns `genres` empty or omitted entirely, so we coerce it to
 * an array rather than leaving it possibly-undefined.
 */
function normalizeArtist(artist: Artist): Artist {
  return { ...artist, genres: artist.genres ?? [] };
}

/**
 * `/me/playlists` can return `null` entries (e.g. an unavailable playlist) and
 * occasionally items missing `tracks`. Filter the nulls and backfill `tracks`.
 */
function normalizePlaylists(
  items: (SimplifiedPlaylist | null)[],
): SimplifiedPlaylist[] {
  return items
    .filter((p): p is SimplifiedPlaylist => p != null && Boolean(p.id))
    .map((p) => ({
      ...p,
      tracks: p.tracks ?? { href: "", total: 0 },
    }));
}

async function spotifyFetch<T>(
  accessToken: string,
  pathOrUrl: string,
  attempt = 0,
): Promise<T> {
  const url = pathOrUrl.startsWith("http")
    ? pathOrUrl
    : `${SPOTIFY_API_BASE}${pathOrUrl}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (res.status === 401) {
    throw new SpotifyAuthError();
  }

  if (res.status === 403) {
    throw new SpotifyScopeError(
      "Spotify denied this request (403) — likely a missing scope.",
    );
  }

  if (res.status === 429) {
    const retryAfter = Number(res.headers.get("Retry-After") ?? "1");
    const waitMs = (retryAfter + 0.3) * 1000;
    if (attempt >= MAX_RETRIES || waitMs > MAX_RETRY_WAIT_MS) {
      throw new SpotifyRateLimitError(retryAfter);
    }
    await sleep(waitMs);
    return spotifyFetch<T>(accessToken, pathOrUrl, attempt + 1);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { error?: { message?: string } };
      if (body?.error?.message) detail = body.error.message;
    } catch {
      // non-JSON body; keep the status-based message
    }
    throw new SpotifyApiError(res.status, detail);
  }

  return (await res.json()) as T;
}

/**
 * Follows offset-based pagination starting from `firstPath`, accumulating items
 * until either `next` is null or `maxItems` is reached.
 */
async function paginate<T>(
  accessToken: string,
  firstPath: string,
  maxItems: number,
): Promise<T[]> {
  const items: T[] = [];
  let nextUrl: string | null = firstPath;

  while (nextUrl && items.length < maxItems) {
    const page: Paging<T> = await spotifyFetch<Paging<T>>(accessToken, nextUrl);
    items.push(...page.items);
    nextUrl = page.next;
  }

  return items.slice(0, maxItems);
}

export interface TopItemsOptions {
  timeRange?: TimeRange;
  limit?: number; // max 50 per request
}

/** Creates a thin, typed client bound to a single access token. */
export function createSpotifyClient(accessToken: string) {
  return {
    getProfile(): Promise<SpotifyUserProfile> {
      return spotifyFetch<SpotifyUserProfile>(accessToken, "/me");
    },

    async getTopArtists(opts: TopItemsOptions = {}): Promise<Paging<Artist>> {
      const { timeRange = "medium_term", limit = 50 } = opts;
      const page = await spotifyFetch<Paging<Artist>>(
        accessToken,
        `/me/top/artists?time_range=${timeRange}&limit=${limit}`,
      );
      return { ...page, items: page.items.map(normalizeArtist) };
    },

    getTopTracks(opts: TopItemsOptions = {}): Promise<Paging<Track>> {
      const { timeRange = "medium_term", limit = 50 } = opts;
      return spotifyFetch<Paging<Track>>(
        accessToken,
        `/me/top/tracks?time_range=${timeRange}&limit=${limit}`,
      );
    },

    /** Last plays. Spotify caps this at the most recent 50 items — no deeper history. */
    getRecentlyPlayed(limit = 50): Promise<CursorPaging<PlayHistory>> {
      return spotifyFetch<CursorPaging<PlayHistory>>(
        accessToken,
        `/me/player/recently-played?limit=${limit}`,
      );
    },

    /** Current user's playlists (owned + followed), paginated up to `maxItems`. */
    async getPlaylists(maxItems = 50): Promise<SimplifiedPlaylist[]> {
      const items = await paginate<SimplifiedPlaylist | null>(
        accessToken,
        `/me/playlists?limit=50`,
        maxItems,
      );
      return normalizePlaylists(items);
    },

    /** Saved ("liked") tracks, paginated up to `maxItems`. */
    getSavedTracks(maxItems = 50): Promise<SavedTrack[]> {
      return paginate<SavedTrack>(accessToken, `/me/tracks?limit=50`, maxItems);
    },

    /**
     * Just the saved-tracks total (cheap: limit=1). Useful for a library overview
     * without pulling the whole library.
     */
    async getSavedTracksTotal(): Promise<number> {
      const page = await spotifyFetch<Paging<SavedTrack>>(
        accessToken,
        `/me/tracks?limit=1`,
      );
      return page.total;
    },

    /** Followed artists (cursor-paginated, nested under `artists`). */
    async getFollowedArtists(limit = 50): Promise<Artist[]> {
      const res = await spotifyFetch<FollowedArtistsResponse>(
        accessToken,
        `/me/following?type=artist&limit=${limit}`,
      );
      return res.artists.items.map(normalizeArtist);
    },
  };
}

export type SpotifyClient = ReturnType<typeof createSpotifyClient>;
