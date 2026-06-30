import { createSpotifyClient } from "./client";
import { SpotifyAuthError } from "./errors";
import type {
  Artist,
  PlayHistory,
  SavedTrack,
  SimplifiedPlaylist,
  TimeRange,
  Track,
} from "./types";

/**
 * Server-side aggregator that loads the core dashboard dataset in parallel.
 *
 * Design notes:
 *   - Each section is isolated: one failing endpoint (e.g. a missing scope)
 *     surfaces as that section's error without blanking the whole dashboard.
 *   - A 401 anywhere is treated as a session-wide auth failure and re-thrown so
 *     the page can redirect to the refresh route.
 *   - This module fetches only. Genre/vibe/era calculations belong to Phase 5.
 */

/** Success-or-error wrapper for an individual dashboard section. */
export type Section<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export interface DashboardData {
  topArtists: Section<Artist[]>;
  topTracks: Section<Track[]>;
  recentlyPlayed: Section<PlayHistory[]>;
  playlists: Section<SimplifiedPlaylist[]>;
  savedTracks: Section<{ sample: SavedTrack[]; total: number }>;
  followedArtists: Section<Artist[]>;
}

export interface LoadDashboardOptions {
  timeRange?: TimeRange;
}

function sectionFromSettled<T>(
  result: PromiseSettledResult<T>,
): Section<T> {
  if (result.status === "fulfilled") {
    return { ok: true, data: result.value };
  }
  const reason = result.reason;
  // Bubble auth failures up to the caller — handled separately below.
  if (reason instanceof SpotifyAuthError) {
    throw reason;
  }
  return {
    ok: false,
    error: reason instanceof Error ? reason.message : "Failed to load.",
  };
}

export async function loadDashboardData(
  accessToken: string,
  opts: LoadDashboardOptions = {},
): Promise<DashboardData> {
  const { timeRange = "medium_term" } = opts;
  const client = createSpotifyClient(accessToken);

  const [
    topArtists,
    topTracks,
    recentlyPlayed,
    playlists,
    savedSample,
    savedTotal,
    followedArtists,
  ] = await Promise.allSettled([
    client.getTopArtists({ timeRange, limit: 50 }).then((p) => p.items),
    client.getTopTracks({ timeRange, limit: 50 }).then((p) => p.items),
    client.getRecentlyPlayed(50).then((p) => p.items),
    client.getPlaylists(50),
    client.getSavedTracks(50),
    client.getSavedTracksTotal(),
    client.getFollowedArtists(50),
  ]);

  // If any rejection is an auth error, sectionFromSettled re-throws it; we run
  // the profile/topArtists check first so the page can redirect to refresh.
  const topArtistsSection = sectionFromSettled(topArtists);

  // Combine the two saved-tracks calls into one section.
  let savedTracksSection: Section<{ sample: SavedTrack[]; total: number }>;
  if (savedSample.status === "fulfilled" && savedTotal.status === "fulfilled") {
    savedTracksSection = {
      ok: true,
      data: { sample: savedSample.value, total: savedTotal.value },
    };
  } else {
    const reason =
      savedSample.status === "rejected"
        ? savedSample.reason
        : (savedTotal as PromiseRejectedResult).reason;
    if (reason instanceof SpotifyAuthError) throw reason;
    savedTracksSection = {
      ok: false,
      error: reason instanceof Error ? reason.message : "Failed to load.",
    };
  }

  return {
    topArtists: topArtistsSection,
    topTracks: sectionFromSettled(topTracks),
    recentlyPlayed: sectionFromSettled(recentlyPlayed),
    playlists: sectionFromSettled(playlists),
    savedTracks: savedTracksSection,
    followedArtists: sectionFromSettled(followedArtists),
  };
}
