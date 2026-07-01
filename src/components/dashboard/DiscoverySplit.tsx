import type { DiscoveryResult } from "@/lib/insights/discovery";

/** Two-segment bar showing discovery vs. comfort share of recent plays. */
export function DiscoverySplit({ data }: { data: DiscoveryResult }) {
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full bg-accent/80"
          style={{ width: `${data.discoveryPercent}%` }}
          aria-hidden
        />
        <div
          className="h-full bg-indigo-400/70"
          style={{ width: `${data.comfortPercent}%` }}
          aria-hidden
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-accent/80" />
          <span className="text-foreground">Discovery</span>
          <span className="tabular-nums text-subtle">
            {data.discoveryPercent}% · {data.discovery}
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="tabular-nums text-subtle">
            {data.comfort} · {data.comfortPercent}%
          </span>
          <span className="text-foreground">Comfort</span>
          <span className="h-2 w-2 rounded-full bg-indigo-400/70" />
        </span>
      </div>

      <p className="mt-3 text-xs text-muted">{data.caption}</p>
      <p className="mt-1 text-[11px] text-subtle">
        Approximate · based on your last {data.total} plays vs. your 6-month
        favorites.
      </p>
    </div>
  );
}
