import type { PeriodBucket } from "@/lib/insights/patterns";

const PERIOD_ICON: Record<string, string> = {
  morning:   "☀️",
  afternoon: "🌤",
  evening:   "🌙",
  night:     "✦",
};

/** Horizontal bar chart of listening by time-of-day period. Mirrors DecadeBars style. */
export function TimeOfDayBars({ buckets }: { buckets: PeriodBucket[] }) {
  const max = Math.max(...buckets.map((b) => b.count), 1);

  return (
    <div className="space-y-3">
      {buckets.map((bucket) => (
        <div key={bucket.period}>
          <div className="mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs text-foreground">
              <span aria-hidden className="text-[13px]">
                {PERIOD_ICON[bucket.period]}
              </span>
              {bucket.label}
              <span className="text-subtle">· {bucket.hours}</span>
            </span>
            <span className="text-[11px] tabular-nums text-subtle">
              {bucket.percent}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-accent/80 transition-all"
              style={{ width: `${(bucket.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
