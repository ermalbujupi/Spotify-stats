import type { VibeResult } from "@/lib/insights/vibes";
import { VibeList } from "./VibeList";

/**
 * Radar chart of the inferred vibe mix. A radar needs at least 3 axes to read
 * well, so with fewer vibes we fall back to the bar list. Pure SVG.
 *
 * Same honesty applies: this is a name/era/time heuristic, not audio analysis.
 */

const CX = 120;
const CY = 104;
const R = 70;

function polar(radius: number, index: number, total: number): { x: number; y: number } {
  const angle = ((index / total) * 2 * Math.PI) - Math.PI / 2;
  return { x: CX + radius * Math.cos(angle), y: CY + radius * Math.sin(angle) };
}

function polygonPoints(radii: number[]): string {
  return radii
    .map((r, i) => {
      const p = polar(r, i, radii.length);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    })
    .join(" ");
}

export function VibeRadar({ data }: { data: VibeResult }) {
  // Fall back to bars when a radar would look degenerate.
  if (data.vibes.length < 3) {
    return <VibeList data={data} />;
  }

  const n = data.vibes.length;
  const maxWeight = Math.max(...data.vibes.map((v) => v.weight), 1);

  const rings = [0.34, 0.67, 1].map((factor) =>
    polygonPoints(new Array(n).fill(R * factor)),
  );

  const dataRadii = data.vibes.map((v) => Math.max((v.weight / maxWeight) * R, 4));

  return (
    <div>
      <svg viewBox="0 0 240 218" className="w-full" role="img" aria-label="Vibe distribution radar">
        {/* grid rings */}
        {rings.map((pts, i) => (
          <polygon key={i} points={pts} className="fill-none stroke-border" strokeWidth={1} opacity={0.6} />
        ))}

        {/* axes */}
        {data.vibes.map((v, i) => {
          const end = polar(R, i, n);
          return (
            <line key={v.key} x1={CX} y1={CY} x2={end.x} y2={end.y} className="stroke-border" strokeWidth={1} opacity={0.5} />
          );
        })}

        {/* data polygon */}
        <polygon
          points={polygonPoints(dataRadii)}
          fill="var(--color-accent)"
          fillOpacity={0.22}
          stroke="var(--color-accent)"
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* vertices + labels */}
        {data.vibes.map((v, i) => {
          const vertex = polar(dataRadii[i], i, n);
          const label = polar(R + 16, i, n);
          const anchor =
            label.x > CX + 6 ? "start" : label.x < CX - 6 ? "end" : "middle";
          return (
            <g key={v.key}>
              <circle cx={vertex.x} cy={vertex.y} r={2.5} fill="var(--color-accent)">
                <title>{`${v.label} — ${v.percent}%`}</title>
              </circle>
              <text
                x={label.x}
                y={label.y}
                textAnchor={anchor}
                dominantBaseline="middle"
                className="fill-[var(--color-muted)]"
                fontSize={9}
              >
                {v.emoji} {v.label}
              </text>
            </g>
          );
        })}
      </svg>

      <p className="mt-2 border-t border-border pt-2 text-[11px] text-subtle">
        {data.lowConfidence ? "Low confidence · " : "Approximate · "}
        inferred from playlist &amp; track names, era, and listening time — not
        audio analysis.
      </p>
    </div>
  );
}
