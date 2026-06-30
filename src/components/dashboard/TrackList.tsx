import { CoverImage } from "@/components/ui/CoverImage";
import { formatDuration } from "@/lib/format";
import type { Track } from "@/lib/spotify/types";

/** Ranked list of tracks with album art, artist names, and duration. */
export function TrackList({
  tracks,
  limit = 10,
}: {
  tracks: Track[];
  limit?: number;
}) {
  return (
    <ol className="space-y-1">
      {tracks.slice(0, limit).map((track, i) => (
        <li
          key={track.id}
          className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-2/60"
        >
          <span className="w-4 shrink-0 text-right text-xs tabular-nums text-subtle">
            {i + 1}
          </span>
          <CoverImage
            images={track.album.images}
            alt={track.album.name}
            className="h-10 w-10 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-foreground">{track.name}</p>
            <p className="truncate text-xs text-subtle">
              {track.artists.map((a) => a.name).join(", ")}
            </p>
          </div>
          <span className="shrink-0 text-xs tabular-nums text-subtle">
            {formatDuration(track.duration_ms)}
          </span>
        </li>
      ))}
    </ol>
  );
}
