import type { VibeResult } from "@/lib/insights/vibes";

/**
 * Inferred vibe distribution. Always shows the "approximate" disclaimer, since
 * this is a name/era/time heuristic — not real audio-mood data.
 */
export function VibeList({ data }: { data: VibeResult }) {
  if (data.vibes.length === 0) {
    return (
      <p className="text-sm text-subtle">
        Not enough naming signal to infer vibes yet. This improves as you build
        playlists with descriptive names.
      </p>
    );
  }

  const max = Math.max(...data.vibes.map((v) => v.weight), 1);

  return (
    <div>
      <ul className="space-y-2.5">
        {data.vibes.map((vibe) => (
          <li key={vibe.key} className="flex items-center gap-3">
            <span className="flex w-24 shrink-0 items-center gap-1.5 text-xs text-foreground">
              <span aria-hidden>{vibe.emoji}</span>
              {vibe.label}
            </span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-accent/80"
                style={{ width: `${(vibe.weight / max) * 100}%` }}
              />
            </div>
            <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-subtle">
              {vibe.percent}%
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-3 border-t border-border pt-2 text-[11px] text-subtle">
        {data.lowConfidence ? "Low confidence · " : "Approximate · "}
        inferred from playlist &amp; track names, era, and listening time — not
        audio analysis (Spotify no longer exposes it).
      </p>
    </div>
  );
}
