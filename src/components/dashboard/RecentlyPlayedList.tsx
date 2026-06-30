import { CoverImage } from "@/components/ui/CoverImage";
import { relativeTime } from "@/lib/format";
import type { PlayHistory } from "@/lib/spotify/types";

/** Vertical timeline of recent plays with artwork and relative timestamps. */
export function RecentlyPlayedList({
  plays,
  limit = 8,
}: {
  plays: PlayHistory[];
  limit?: number;
}) {
  return (
    <ul className="space-y-1">
      {plays.slice(0, limit).map((play, i) => (
        <li
          key={`${play.track.id}-${i}`}
          className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-2/60"
        >
          <CoverImage
            images={play.track.album.images}
            alt={play.track.album.name}
            className="h-9 w-9 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-foreground">
              {play.track.name}
            </p>
            <p className="truncate text-xs text-subtle">
              {play.track.artists.map((a) => a.name).join(", ")}
            </p>
          </div>
          <span className="shrink-0 text-[11px] tabular-nums text-subtle">
            {relativeTime(play.played_at)}
          </span>
        </li>
      ))}
    </ul>
  );
}
