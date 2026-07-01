import type { PlayHistory } from "@/lib/spotify/types";

/**
 * Listening-pattern analysis from recently-played history.
 * Genre-independent — all derived from timestamps and track metadata.
 */

export type DayPeriod = "morning" | "afternoon" | "evening" | "night";

export interface PeriodBucket {
  period: DayPeriod;
  label: string;
  hours: string;
  count: number;
  percent: number;
}

const PERIOD_ORDER: DayPeriod[] = ["morning", "afternoon", "evening", "night"];

const PERIOD_META: Record<DayPeriod, { label: string; hours: string }> = {
  morning:   { label: "Morning",   hours: "6am – 12pm" },
  afternoon: { label: "Afternoon", hours: "12pm – 5pm" },
  evening:   { label: "Evening",   hours: "5pm – 10pm" },
  night:     { label: "Night",     hours: "10pm – 6am" },
};

function toPeriod(hour: number): DayPeriod {
  if (hour >= 6  && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

/** Groups recent plays into morning/afternoon/evening/night buckets. */
export function timeOfDayBreakdown(plays: PlayHistory[]): PeriodBucket[] {
  const counts = new Map<DayPeriod, number>();
  let total = 0;

  for (const play of plays) {
    const hour = new Date(play.played_at).getHours();
    const period = toPeriod(hour);
    counts.set(period, (counts.get(period) ?? 0) + 1);
    total++;
  }

  if (total === 0) return [];

  return PERIOD_ORDER.map((period) => {
    const count = counts.get(period) ?? 0;
    return {
      period,
      ...PERIOD_META[period],
      count,
      percent: Math.round((count / total) * 100),
    };
  });
}

export interface RepeatedTrack {
  trackId: string;
  name: string;
  artist: string;
  albumArt: string | null;
  plays: number;
}

/** Returns tracks that appear more than once in the recent-plays list, most-played first. */
export function repeatedTracks(
  plays: PlayHistory[],
  minPlays = 2,
): RepeatedTrack[] {
  const seen = new Map<string, { count: number; play: PlayHistory }>();

  for (const play of plays) {
    const entry = seen.get(play.track.id);
    if (entry) {
      entry.count++;
    } else {
      seen.set(play.track.id, { count: 1, play });
    }
  }

  return [...seen.entries()]
    .filter(([, { count }]) => count >= minPlays)
    .map(([trackId, { count, play }]) => ({
      trackId,
      name: play.track.name,
      artist: play.track.artists.map((a) => a.name).join(", "),
      albumArt: play.track.album.images[0]?.url ?? null,
      plays: count,
    }))
    .sort((a, b) => b.plays - a.plays);
}

/** Number of distinct calendar days (local time) present in the recent-plays list. */
export function activeDays(plays: PlayHistory[]): number {
  const days = new Set(
    plays.map((p) => new Date(p.played_at).toLocaleDateString()),
  );
  return days.size;
}

/** Peak period label (the one with the highest count), or null if no plays. */
export function peakPeriod(buckets: PeriodBucket[]): DayPeriod | null {
  if (buckets.length === 0) return null;
  return buckets.reduce((a, b) => (b.count > a.count ? b : a)).period;
}
