import { CoverImage } from "@/components/ui/CoverImage";
import type { Artist } from "@/lib/spotify/types";

/** Responsive grid of ranked artist tiles with circular artwork. */
export function ArtistGrid({
  artists,
  limit = 10,
}: {
  artists: Artist[];
  limit?: number;
}) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
      {artists.slice(0, limit).map((artist, i) => (
        <li key={artist.id} className="group flex flex-col items-center text-center">
          <div className="relative">
            <CoverImage
              images={artist.images}
              alt={artist.name}
              shape="circle"
              className="h-20 w-20 ring-1 ring-border transition-transform group-hover:scale-[1.04] sm:h-24 sm:w-24"
            />
            <span className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-base text-[10px] font-semibold tabular-nums text-muted ring-1 ring-border">
              {i + 1}
            </span>
          </div>
          <p className="mt-2 line-clamp-2 text-xs font-medium text-foreground">
            {artist.name}
          </p>
          {artist.genres.length > 0 ? (
            <p className="mt-0.5 line-clamp-1 text-[10px] text-subtle">
              {artist.genres[0]}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
