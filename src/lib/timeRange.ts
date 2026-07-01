import type { TimeRange } from "@/lib/spotify/types";

/**
 * Shared time-range options + label helpers.
 *
 * Spotify's top-items endpoints support exactly three windows. Only top
 * artists/tracks (and anything derived from them) respond to this — recently
 * played, playlists, and the saved library are not time-range scoped.
 */
export const TIME_RANGE_OPTIONS: {
  value: TimeRange;
  short: string; // toggle label
  long: string; // descriptive label
}[] = [
  { value: "short_term", short: "4 weeks", long: "Last 4 weeks" },
  { value: "medium_term", short: "6 months", long: "Last 6 months" },
  { value: "long_term", short: "12 months", long: "Last 12 months" },
];

const VALID = new Set<TimeRange>(["short_term", "medium_term", "long_term"]);

/** Parse an untrusted query value into a TimeRange, defaulting to 6 months. */
export function parseTimeRange(value: string | undefined): TimeRange {
  return value && VALID.has(value as TimeRange)
    ? (value as TimeRange)
    : "medium_term";
}

export function timeRangeLongLabel(range: TimeRange): string {
  return (
    TIME_RANGE_OPTIONS.find((o) => o.value === range)?.long ?? "Last 6 months"
  );
}
