import type { PlayHistory } from "@/lib/spotify/types";

/**
 * Per-hour listening distribution from recently-played, for the radial
 * "listening clock". Same caveats as patterns.ts: it's a ~50-play recent
 * sample in the server's local timezone. Pure function.
 */

export interface HourBucket {
  hour: number; // 0–23
  count: number;
}

/** Always returns 24 buckets (0–23), including zeros. */
export function hourlyBreakdown(plays: PlayHistory[]): HourBucket[] {
  const counts = new Array<number>(24).fill(0);
  for (const play of plays) {
    const hour = new Date(play.played_at).getHours();
    if (hour >= 0 && hour < 24) counts[hour] += 1;
  }
  return counts.map((count, hour) => ({ hour, count }));
}
