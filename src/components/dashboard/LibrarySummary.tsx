import type { LibrarySummary as LibrarySummaryData } from "@/lib/insights/library";

/** Grid of library/playlist metrics derived from playlists + liked songs. */
export function LibrarySummary({ data }: { data: LibrarySummaryData }) {
  const cells: { value: string; label: string }[] = [
    { value: data.likedSongs.toLocaleString(), label: "Liked songs" },
    { value: String(data.playlistCount), label: "Playlists" },
    { value: String(data.ownedCount), label: "Created by you" },
    { value: String(data.avgPlaylistSize), label: "Avg playlist size" },
    {
      value: data.totalPlaylistTracks.toLocaleString(),
      label: "Tracks in playlists",
    },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cells.map((c) => (
          <div
            key={c.label}
            className="rounded-lg border border-border bg-surface/40 px-3 py-2.5"
          >
            <p className="text-xl font-semibold tracking-tight text-foreground">
              {c.value}
            </p>
            <p className="mt-0.5 text-[11px] text-subtle">{c.label}</p>
          </div>
        ))}
      </div>
      {data.largestPlaylist ? (
        <p className="mt-3 text-xs text-subtle">
          Largest playlist:{" "}
          <span className="text-muted">{data.largestPlaylist.name}</span> (
          {data.largestPlaylist.total.toLocaleString()} tracks)
        </p>
      ) : null}
    </div>
  );
}
