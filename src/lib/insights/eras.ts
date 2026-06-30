import type { Track } from "@/lib/spotify/types";

/**
 * Era / decade analysis from album release dates.
 *
 * This is reliable Spotify data (release_date survived the 2024–2026 cuts),
 * so it's a solid, genre-free insight. Pure functions only — no fetching.
 */

export interface DecadeBucket {
  decade: number; // e.g. 2010
  label: string; // "2010s"
  count: number;
  percent: number; // 0–100, share of dated tracks
}

/**
 * Parses the leading year from a Spotify release_date, which may be
 * "2019", "2019-03", or "2019-03-21". Returns null if unparseable.
 */
export function releaseYear(track: Track): number | null {
  const rd = track.album?.release_date;
  if (!rd) return null;
  const year = Number.parseInt(rd.slice(0, 4), 10);
  return Number.isFinite(year) ? year : null;
}

/** Groups tracks into decade buckets, sorted oldest → newest. */
export function decadeBreakdown(tracks: Track[]): DecadeBucket[] {
  const counts = new Map<number, number>();
  let dated = 0;

  for (const track of tracks) {
    const year = releaseYear(track);
    if (year == null) continue;
    const decade = Math.floor(year / 10) * 10;
    counts.set(decade, (counts.get(decade) ?? 0) + 1);
    dated += 1;
  }

  if (dated === 0) return [];

  return [...counts.entries()]
    .map(([decade, count]) => ({
      decade,
      label: `${decade}s`,
      count,
      percent: Math.round((count / dated) * 100),
    }))
    .sort((a, b) => a.decade - b.decade);
}
