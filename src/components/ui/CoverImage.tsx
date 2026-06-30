import type { SpotifyImage } from "@/lib/spotify/types";

/**
 * Artwork thumbnail for albums/artists.
 *
 * Uses a plain <img> (not next/image) on purpose: Spotify art is usually on
 * i.scdn.co, but profile/mosaic images can come from other CDNs, and we'd
 * rather not couple to an allowlist or risk a render crash. Falls back to a
 * neutral placeholder with a music glyph when no image is available.
 */
export function CoverImage({
  images,
  alt,
  shape = "square",
  className = "",
}: {
  images?: SpotifyImage[] | null;
  alt: string;
  shape?: "square" | "circle";
  className?: string;
}) {
  const url = images?.find((img) => img.url)?.url;
  const radius = shape === "circle" ? "rounded-full" : "rounded-md";

  if (!url) {
    return (
      <div
        className={`flex items-center justify-center bg-surface-2 text-subtle ${radius} ${className}`}
        aria-hidden
      >
        <span className="text-xs opacity-60">♪</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      className={`object-cover ${radius} ${className}`}
    />
  );
}
