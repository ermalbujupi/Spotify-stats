import type { DecadeBucket } from "@/lib/insights/eras";

/**
 * Lightweight horizontal bar chart of decade distribution. Pure CSS — a real
 * charting library arrives in Phase 6 for the richer visualizations.
 */
export function DecadeBars({ buckets }: { buckets: DecadeBucket[] }) {
  const max = Math.max(...buckets.map((b) => b.count), 1);

  return (
    <div className="space-y-2.5">
      {buckets.map((bucket) => (
        <div key={bucket.decade} className="flex items-center gap-3">
          <span className="w-12 shrink-0 text-xs tabular-nums text-subtle">
            {bucket.label}
          </span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-accent/80"
              style={{ width: `${(bucket.count / max) * 100}%` }}
            />
          </div>
          <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-subtle">
            {bucket.percent}%
          </span>
        </div>
      ))}
    </div>
  );
}
