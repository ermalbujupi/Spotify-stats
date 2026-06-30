import type { SimplifiedPlaylist } from "@/lib/spotify/types";

/**
 * Library & playlist behavior summary. Pure function — no fetching.
 */

export interface LibrarySummary {
  likedSongs: number;
  playlistCount: number;
  ownedCount: number;
  followedCount: number;
  totalPlaylistTracks: number;
  avgPlaylistSize: number;
  largestPlaylist: { name: string; total: number } | null;
}

export function summarizeLibrary(
  playlists: SimplifiedPlaylist[],
  likedSongs: number,
  currentUserId: string,
): LibrarySummary {
  const ownedCount = playlists.filter(
    (p) => p.owner.id === currentUserId,
  ).length;

  const totalPlaylistTracks = playlists.reduce(
    (sum, p) => sum + p.tracks.total,
    0,
  );

  const largest = playlists.reduce<SimplifiedPlaylist | null>(
    (max, p) => (!max || p.tracks.total > max.tracks.total ? p : max),
    null,
  );

  return {
    likedSongs,
    playlistCount: playlists.length,
    ownedCount,
    followedCount: playlists.length - ownedCount,
    totalPlaylistTracks,
    avgPlaylistSize: playlists.length
      ? Math.round(totalPlaylistTracks / playlists.length)
      : 0,
    largestPlaylist: largest
      ? { name: largest.name, total: largest.tracks.total }
      : null,
  };
}
