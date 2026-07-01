import type { Track } from "@/lib/spotify/types";

/**
 * Artist-diversity ("variety") score from your top tracks.
 *
 * score = distinct primary artists / total tracks, as a percentage.
 *   100 → every top track is a different artist (very eclectic)
 *   low → a few artists dominate your top tracks
 *
 * Pure function. Genre-free — uses only artist identity.
 */

export interface DiversityResult {
  score: number; // 0–100
  distinctArtists: number;
  totalTracks: number;
  topArtistName: string | null;
  topArtistShare: number; // % of top tracks by the most frequent artist
  caption: string;
}

export function artistDiversity(topTracks: Track[]): DiversityResult {
  const counts = new Map<string, { name: string; count: number }>();

  for (const track of topTracks) {
    const primary = track.artists[0];
    if (!primary) continue;
    const entry = counts.get(primary.id) ?? { name: primary.name, count: 0 };
    entry.count += 1;
    counts.set(primary.id, entry);
  }

  const totalTracks = topTracks.length;
  const distinctArtists = counts.size;

  let top: { name: string; count: number } | null = null;
  for (const entry of counts.values()) {
    if (!top || entry.count > top.count) top = entry;
  }

  const score = totalTracks
    ? Math.round((distinctArtists / totalTracks) * 100)
    : 0;
  const topArtistShare =
    totalTracks && top ? Math.round((top.count / totalTracks) * 100) : 0;

  const caption =
    score >= 80
      ? "Very eclectic — you rarely repeat an artist"
      : score >= 60
        ? "Broad taste spread across many artists"
        : score >= 40
          ? "A balanced mix of favorites and variety"
          : "Focused — a few artists dominate your rotation";

  return {
    score,
    distinctArtists,
    totalTracks,
    topArtistName: top?.name ?? null,
    topArtistShare,
    caption,
  };
}
