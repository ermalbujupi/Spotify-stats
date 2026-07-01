import Image from "next/image";
import type { RepeatedTrack } from "@/lib/insights/patterns";

/** Tracks the user played more than once in their recent history. */
export function RepeatsList({ tracks }: { tracks: RepeatedTrack[] }) {
  if (tracks.length === 0) {
    return (
      <p className="text-sm text-subtle">
        No tracks played more than once in the last 50 plays.
      </p>
    );
  }

  return (
    <ul className="space-y-1">
      {tracks.map((track) => (
        <li
          key={track.trackId}
          className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-2/60"
        >
          {track.albumArt ? (
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded">
              <Image
                src={track.albumArt}
                alt=""
                fill
                className="object-cover"
                sizes="36px"
              />
            </div>
          ) : (
            <div className="h-9 w-9 shrink-0 rounded bg-surface-2" />
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-foreground">{track.name}</p>
            <p className="truncate text-xs text-subtle">{track.artist}</p>
          </div>

          <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-medium tabular-nums text-accent">
            ×{track.plays}
          </span>
        </li>
      ))}
    </ul>
  );
}
