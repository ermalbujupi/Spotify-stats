import type { HourBucket } from "@/lib/insights/timeline";

/**
 * A 24-hour radial "listening clock": each spoke is an hour of the day
 * (midnight at top), its length + brightness proportional to how often you
 * played music then. Pure SVG — server-rendered, no chart dependency.
 */

const CENTER = 120;
const INNER_R = 52;
const BAR_MAX = 52;

/** Polar → cartesian, with 0° at the top (midnight). */
function polar(radius: number, hour: number): { x: number; y: number } {
  const angle = ((hour * 15 - 90) * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.cos(angle),
    y: CENTER + radius * Math.sin(angle),
  };
}

const HOUR_LABELS: { hour: number; text: string }[] = [
  { hour: 0, text: "12a" },
  { hour: 6, text: "6a" },
  { hour: 12, text: "12p" },
  { hour: 18, text: "6p" },
];

export function ListeningClock({ hours }: { hours: HourBucket[] }) {
  const max = Math.max(...hours.map((h) => h.count), 1);
  const total = hours.reduce((sum, h) => sum + h.count, 0);
  const peak = hours.reduce((a, b) => (b.count > a.count ? b : a));

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 240 240"
        className="h-56 w-56"
        role="img"
        aria-label="Listening activity by hour of day"
      >
        {/* guide rings */}
        <circle cx={CENTER} cy={CENTER} r={INNER_R} className="fill-none stroke-border" strokeWidth={1} />
        <circle cx={CENTER} cy={CENTER} r={INNER_R + BAR_MAX} className="fill-none stroke-border" strokeWidth={1} opacity={0.5} />

        {/* hour spokes */}
        {hours.map(({ hour, count }) => {
          const intensity = count / max;
          const len = count > 0 ? 10 + intensity * (BAR_MAX - 10) : 3;
          const start = polar(INNER_R, hour);
          const end = polar(INNER_R + len, hour);
          return (
            <line
              key={hour}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke="var(--color-accent)"
              strokeWidth={5.5}
              strokeLinecap="round"
              opacity={count > 0 ? 0.25 + intensity * 0.75 : 0.12}
            >
              <title>{`${formatHour(hour)} — ${count} play${count === 1 ? "" : "s"}`}</title>
            </line>
          );
        })}

        {/* clock labels */}
        {HOUR_LABELS.map(({ hour, text }) => {
          const p = polar(INNER_R + BAR_MAX + 12, hour);
          return (
            <text
              key={hour}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-[var(--color-subtle)]"
              fontSize={9}
            >
              {text}
            </text>
          );
        })}

        {/* center readout */}
        <text x={CENTER} y={CENTER - 6} textAnchor="middle" className="fill-[var(--color-foreground)]" fontSize={22} fontWeight={600}>
          {total}
        </text>
        <text x={CENTER} y={CENTER + 12} textAnchor="middle" className="fill-[var(--color-subtle)]" fontSize={9}>
          recent plays
        </text>
      </svg>

      <p className="mt-1 text-xs text-muted">
        Most active around{" "}
        <span className="text-foreground">{formatHour(peak.hour)}</span>
      </p>
      <p className="mt-0.5 text-[11px] text-subtle">
        Based on your last {total} plays · local time
      </p>
    </div>
  );
}

function formatHour(hour: number): string {
  const period = hour < 12 ? "am" : "pm";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}${period}`;
}
