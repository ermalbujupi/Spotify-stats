import Image from "next/image";
import type { SpotifyUserProfile } from "@/lib/spotify/profile";

/**
 * Compact authenticated-user card shown in the dashboard header.
 * Falls back to an initial when the user has no avatar.
 */
export function ProfileCard({ profile }: { profile: SpotifyUserProfile }) {
  const name = profile.display_name?.trim() || profile.id;
  const avatar = profile.images?.find((img) => img.url)?.url;
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-surface/60 py-1 pl-1 pr-1.5">
      {avatar ? (
        <Image
          src={avatar}
          alt=""
          width={28}
          height={28}
          className="h-7 w-7 rounded-full object-cover"
        />
      ) : (
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-2 text-xs font-medium text-muted">
          {initial}
        </span>
      )}
      <span className="max-w-[10rem] truncate text-xs font-medium text-foreground">
        {name}
      </span>
      <a
        href="/api/auth/logout"
        className="ml-1 rounded-full px-2 py-1 text-xs text-subtle transition-colors hover:text-foreground"
        title="Log out"
      >
        Log out
      </a>
    </div>
  );
}
