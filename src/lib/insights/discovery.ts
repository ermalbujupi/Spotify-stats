import type { Artist, PlayHistory, Track } from "@/lib/spotify/types";

/**
 * Discovery vs. comfort listening.
 *
 * For each recent play, we call it "comfort" if the track is one of your top
 * tracks OR by one of your top artists; otherwise "discovery".
 *
 * APPROXIMATION: recently-played is only ~50 plays, and "top" reflects the
 * 6-month window — so this is a rough recent snapshot, not a lifetime measure.
 * Pure function.
 */

export interface DiscoveryResult {
  discovery: number;
  comfort: number;
  total: number;
  discoveryPercent: number;
  comfortPercent: number;
  caption: string;
}

export function discoveryVsComfort(
  recentPlays: PlayHistory[],
  topTracks: Track[],
  topArtists: Artist[],
): DiscoveryResult {
  const topTrackIds = new Set(topTracks.map((t) => t.id));
  const topArtistIds = new Set(topArtists.map((a) => a.id));

  let comfort = 0;
  for (const play of recentPlays) {
    const isComfort =
      topTrackIds.has(play.track.id) ||
      play.track.artists.some((a) => topArtistIds.has(a.id));
    if (isComfort) comfort += 1;
  }

  const total = recentPlays.length;
  const discovery = total - comfort;
  const discoveryPercent = total ? Math.round((discovery / total) * 100) : 0;
  const comfortPercent = total ? 100 - discoveryPercent : 0;

  const caption =
    total === 0
      ? "No recent plays to analyze"
      : discoveryPercent >= 60
        ? "Explorer mode — lots of fresh music lately"
        : discoveryPercent >= 35
          ? "A healthy balance of new and familiar"
          : "Comfort listening — mostly your established favorites";

  return {
    discovery,
    comfort,
    total,
    discoveryPercent,
    comfortPercent,
    caption,
  };
}
