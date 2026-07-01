import type { DiscoveryResult } from "@/lib/insights/discovery";

/**
 * Donut chart of discovery vs. comfort listening, with legend + caption.
 * Pure SVG. Two arcs drawn via stroke-dasharray on concentric circles.
 */

const R = 45;
const C = 2 * Math.PI * R;

export function DiscoveryDonut({ data }: { data: DiscoveryResult }) {
  const discoveryLen = (data.discoveryPercent / 100) * C;
  const comfortRotation = -90 + (data.discoveryPercent / 100) * 360;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-8">
      <svg viewBox="0 0 120 120" className="h-40 w-40 shrink-0" role="img" aria-label="Discovery versus comfort">
        {/* track */}
        <circle cx={60} cy={60} r={R} className="fill-none stroke-surface-2" strokeWidth={14} />

        {/* discovery arc */}
        <circle
          cx={60}
          cy={60}
          r={R}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={14}
          strokeDasharray={`${discoveryLen} ${C - discoveryLen}`}
          strokeLinecap="butt"
          transform="rotate(-90 60 60)"
        />

        {/* comfort arc */}
        <circle
          cx={60}
          cy={60}
          r={R}
          fill="none"
          stroke="rgb(129 140 248 / 0.75)"
          strokeWidth={14}
          strokeDasharray={`${(data.comfortPercent / 100) * C} ${C - (data.comfortPercent / 100) * C}`}
          strokeLinecap="butt"
          transform={`rotate(${comfortRotation} 60 60)`}
        />

        <text x={60} y={56} textAnchor="middle" className="fill-[var(--color-foreground)]" fontSize={20} fontWeight={600}>
          {data.discoveryPercent}%
        </text>
        <text x={60} y={72} textAnchor="middle" className="fill-[var(--color-subtle)]" fontSize={9}>
          discovery
        </text>
      </svg>

      <div className="min-w-0">
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-accent" />
            <span className="text-foreground">Discovery</span>
            <span className="tabular-nums text-subtle">
              {data.discovery} plays · {data.discoveryPercent}%
            </span>
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "rgb(129 140 248 / 0.75)" }} />
            <span className="text-foreground">Comfort</span>
            <span className="tabular-nums text-subtle">
              {data.comfort} plays · {data.comfortPercent}%
            </span>
          </li>
        </ul>
        <p className="mt-3 text-xs text-muted">{data.caption}</p>
        <p className="mt-1 text-[11px] text-subtle">
          Approximate · your last {data.total} plays vs. your top favorites.
        </p>
      </div>
    </div>
  );
}
