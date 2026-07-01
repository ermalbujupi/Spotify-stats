import Link from "next/link";
import type { TimeRange } from "@/lib/spotify/types";
import { TIME_RANGE_OPTIONS } from "@/lib/timeRange";

/**
 * Segmented control that switches the dashboard's time range via the `?range=`
 * query param. Plain links → the server component re-fetches and re-derives
 * everything for the chosen window (no client JS needed).
 */
export function TimeRangeToggle({ active }: { active: TimeRange }) {
  return (
    <div className="flex w-full items-center rounded-full border border-border bg-surface/60 p-0.5 sm:w-auto">
      {TIME_RANGE_OPTIONS.map((opt) => {
        const isActive = opt.value === active;
        return (
          <Link
            key={opt.value}
            href={`/dashboard?range=${opt.value}`}
            scroll={false}
            aria-current={isActive ? "true" : undefined}
            className={`flex-1 rounded-full px-3 py-1 text-center text-xs transition-colors sm:flex-none ${
              isActive
                ? "bg-surface-2 text-foreground"
                : "text-subtle hover:text-foreground"
            }`}
          >
            {opt.short}
          </Link>
        );
      })}
    </div>
  );
}
