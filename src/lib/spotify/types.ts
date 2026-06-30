/**
 * Typed models for the Spotify Web API responses we consume.
 *
 * These reflect the post-Feb-2026 reality for development-mode apps:
 *   - `popularity` and `followers` are NOT modeled (removed from the API).
 *   - Only fields we actually use are included, to keep the surface small.
 */

export type TimeRange = "short_term" | "medium_term" | "long_term";

export interface SpotifyImage {
  url: string;
  height: number | null;
  width: number | null;
}

export interface ExternalUrls {
  spotify?: string;
}

/** Full artist object (from /me/top/artists and /me/following). */
export interface Artist {
  id: string;
  name: string;
  genres: string[];
  images: SpotifyImage[];
  external_urls: ExternalUrls;
  uri: string;
  type: "artist";
}

/** Artist reference embedded in tracks/albums (no genres/images). */
export interface SimplifiedArtist {
  id: string;
  name: string;
  external_urls: ExternalUrls;
  uri: string;
  type: "artist";
}

export type ReleaseDatePrecision = "year" | "month" | "day";

export interface SimplifiedAlbum {
  id: string;
  name: string;
  album_type: string;
  images: SpotifyImage[];
  release_date: string; // e.g. "2019", "2019-03", "2019-03-21"
  release_date_precision: ReleaseDatePrecision;
  total_tracks: number;
  artists: SimplifiedArtist[];
  external_urls: ExternalUrls;
  uri: string;
}

export interface Track {
  id: string;
  name: string;
  duration_ms: number;
  explicit: boolean;
  artists: SimplifiedArtist[];
  album: SimplifiedAlbum;
  external_urls: ExternalUrls;
  uri: string;
  type: "track";
  is_local?: boolean;
}

/** A single entry from /me/player/recently-played. */
export interface PlayHistory {
  track: Track;
  played_at: string; // ISO timestamp
  context: {
    type: string;
    uri: string;
    external_urls: ExternalUrls;
  } | null;
}

export interface SavedTrack {
  added_at: string;
  track: Track;
}

export interface SimplifiedPlaylist {
  id: string;
  name: string;
  description: string | null;
  images: SpotifyImage[] | null;
  collaborative: boolean;
  public: boolean | null;
  owner: {
    id: string;
    display_name: string | null;
  };
  tracks: {
    href: string;
    total: number;
  };
  external_urls: ExternalUrls;
  uri: string;
}

export interface SpotifyUserProfile {
  id: string;
  display_name: string | null;
  images?: SpotifyImage[];
  external_urls?: ExternalUrls;
  uri?: string;
}

/** Standard offset-based paging object. */
export interface Paging<T> {
  href: string;
  items: T[];
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
}

/** Cursor-based paging (used by recently-played and followed artists). */
export interface CursorPaging<T> {
  href: string;
  items: T[];
  limit: number;
  next: string | null;
  cursors: { after: string | null; before?: string | null };
  total?: number;
}

/** /me/following?type=artist nests the cursor page under `artists`. */
export interface FollowedArtistsResponse {
  artists: CursorPaging<Artist>;
}
