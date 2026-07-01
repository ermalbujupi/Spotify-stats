import { createSpotifyClient } from "@/lib/spotify/client";
import { releaseYear } from "@/lib/insights/eras";
import { timeRangeLongLabel } from "@/lib/timeRange";
import type { TimeRange } from "@/lib/spotify/types";
import type { SommelierInput } from "./sommelier";

/**
 * Builds the AI input payload from Spotify, server-side. Shared by the
 * Sommelier and Twin routes so client input is never trusted for prompts.
 */
export async function buildProfileInput(
  accessToken: string,
  range: TimeRange,
): Promise<{ profileId: string; input: SommelierInput }> {
  const spotify = createSpotifyClient(accessToken);

  const [profile, artistsPage, tracksPage, playlists] = await Promise.all([
    spotify.getProfile(),
    spotify.getTopArtists({ timeRange: range, limit: 50 }),
    spotify.getTopTracks({ timeRange: range, limit: 50 }),
    spotify.getPlaylists(50),
  ]);

  return {
    profileId: profile.id,
    input: {
      rangeLabel: timeRangeLongLabel(range).toLowerCase(),
      topArtists: artistsPage.items.map((a) => a.name),
      topTracks: tracksPage.items.map((t) => ({
        name: t.name,
        artist: t.artists[0]?.name ?? "Unknown",
        year: releaseYear(t),
      })),
      playlistNames: playlists.map((p) => p.name),
    },
  };
}
