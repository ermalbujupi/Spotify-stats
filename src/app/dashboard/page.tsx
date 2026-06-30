import { redirect } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Wordmark } from "@/components/brand/Wordmark";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConnectButton } from "@/components/auth/ConnectButton";
import { ProfileCard } from "@/components/auth/ProfileCard";
import { getSession, isExpired } from "@/lib/auth/session";
import { fetchProfile } from "@/lib/spotify/profile";
import { SpotifyAuthError } from "@/lib/spotify/errors";
import {
  loadDashboardData,
  type DashboardData,
  type Section,
} from "@/lib/spotify/dashboard-data";
import type { SpotifyUserProfile } from "@/lib/spotify/types";

/**
 * Dashboard (Phase 3).
 * Fetches the full core dataset via the data layer and renders simple,
 * data-driven panels to verify everything flows end to end. Phase 4 replaces
 * these with polished cards, charts, and genre/era visuals.
 */

const TIME_RANGES = ["4 weeks", "6 months", "12 months"] as const;

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    return <DisconnectedDashboard />;
  }

  if (isExpired(session)) {
    redirect("/api/auth/refresh?returnTo=/dashboard");
  }

  // Profile is the canonical auth probe; an auth failure sends us to refresh.
  let profile: SpotifyUserProfile;
  let data: DashboardData;
  try {
    profile = await fetchProfile(session.accessToken);
    data = await loadDashboardData(session.accessToken, {
      timeRange: "medium_term",
    });
  } catch (err) {
    if (err instanceof SpotifyAuthError) {
      redirect("/api/auth/refresh?returnTo=/dashboard");
    }
    return (
      <ErrorDashboard
        message={
          err instanceof Error
            ? err.message
            : "Couldn't load your Spotify data."
        }
      />
    );
  }

  return <ConnectedDashboard profile={profile} data={data} />;
}

/* ----------------------------- header shell ------------------------------ */

function DashboardHeader({ right }: { right: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-base/70 py-4 backdrop-blur-md">
      <Container className="flex items-center justify-between gap-4">
        <Link href="/">
          <Wordmark />
        </Link>
        <div className="flex items-center gap-3">
          <div className="hidden items-center rounded-full border border-border bg-surface/60 p-0.5 sm:flex">
            {TIME_RANGES.map((r, i) => (
              <span
                key={r}
                className={`rounded-full px-3 py-1 text-xs ${
                  i === 1 ? "bg-surface-2 text-foreground" : "text-subtle"
                }`}
              >
                {r}
              </span>
            ))}
          </div>
          {right}
        </div>
      </Container>
    </header>
  );
}

/* --------------------------- connected variant --------------------------- */

function ConnectedDashboard({
  profile,
  data,
}: {
  profile: SpotifyUserProfile;
  data: DashboardData;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <DashboardHeader right={<ProfileCard profile={profile} />} />

      <main className="flex-1 py-8">
        <Container>
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome
              {profile.display_name ? `, ${profile.display_name}` : ""}
            </h1>
            <p className="mt-1 text-sm text-muted">
              Data layer is live (showing your last 6 months). Polished visuals
              arrive in Phase 4.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Panel
              title="Top artists"
              subtitle="Last 6 months"
              section={data.topArtists}
              isEmpty={(a) => a.length === 0}
              emptyMessage="No top artists yet — listen a bit more."
              render={(artists) => (
                <RankedList
                  items={artists.slice(0, 5).map((a) => ({
                    key: a.id,
                    primary: a.name,
                    // Genres are omitted: Spotify returns them empty for this
                    // app (known API regression). See Phase 5 pivot.
                    secondary: a.genres.length
                      ? a.genres.slice(0, 2).join(", ")
                      : undefined,
                  }))}
                  footer={`${artists.length} loaded`}
                />
              )}
            />

            <Panel
              title="Top tracks"
              subtitle="Last 6 months"
              section={data.topTracks}
              isEmpty={(t) => t.length === 0}
              emptyMessage="No top tracks yet."
              render={(tracks) => (
                <RankedList
                  items={tracks.slice(0, 5).map((t) => ({
                    key: t.id,
                    primary: t.name,
                    secondary: t.artists.map((a) => a.name).join(", "),
                  }))}
                  footer={`${tracks.length} loaded`}
                />
              )}
            />

            <Panel
              title="Recently played"
              subtitle="Your last 50 plays"
              section={data.recentlyPlayed}
              isEmpty={(p) => p.length === 0}
              emptyMessage="Nothing played recently."
              render={(plays) => (
                <RankedList
                  numbered={false}
                  items={plays.slice(0, 5).map((p, i) => ({
                    key: `${p.track.id}-${i}`,
                    primary: p.track.name,
                    secondary: `${p.track.artists
                      .map((a) => a.name)
                      .join(", ")} · ${relativeTime(p.played_at)}`,
                  }))}
                  footer={`${plays.length} plays`}
                />
              )}
            />

            <Panel
              title="Playlists"
              subtitle="Owned & followed"
              section={data.playlists}
              isEmpty={(p) => p.length === 0}
              emptyMessage="No playlists found."
              render={(playlists) => (
                <RankedList
                  numbered={false}
                  items={playlists.slice(0, 5).map((p) => ({
                    key: p.id,
                    primary: p.name,
                    secondary: `${p.tracks.total} tracks · ${
                      p.owner.display_name ?? p.owner.id
                    }`,
                  }))}
                  footer={`${playlists.length} loaded`}
                />
              )}
            />

            <Panel
              title="Saved library"
              subtitle="Liked songs"
              section={data.savedTracks}
              isEmpty={(s) => s.total === 0}
              emptyMessage="No saved tracks."
              render={(saved) => (
                <div className="space-y-3">
                  <Stat value={saved.total.toLocaleString()} label="liked songs" />
                  <RankedList
                    numbered={false}
                    items={saved.sample.slice(0, 3).map((s) => ({
                      key: s.track.id,
                      primary: s.track.name,
                      secondary: s.track.artists.map((a) => a.name).join(", "),
                    }))}
                  />
                </div>
              )}
            />

            <Panel
              title="Followed artists"
              subtitle="Artists you follow"
              section={data.followedArtists}
              isEmpty={(a) => a.length === 0}
              emptyMessage="You don't follow any artists yet."
              render={(artists) => (
                <div className="space-y-3">
                  <Stat
                    value={String(artists.length)}
                    label="followed artists"
                  />
                  <RankedList
                    numbered={false}
                    items={artists.slice(0, 3).map((a) => ({
                      key: a.id,
                      primary: a.name,
                    }))}
                  />
                </div>
              )}
            />
          </div>
        </Container>
      </main>
    </div>
  );
}

/* ------------------------- disconnected / error -------------------------- */

function DisconnectedDashboard() {
  return (
    <div className="flex min-h-dvh flex-col">
      <DashboardHeader
        right={
          <Link
            href="/api/auth/login"
            className="rounded-full border border-border bg-surface/60 px-4 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-2"
          >
            Connect
          </Link>
        }
      />
      <main className="flex-1 py-8">
        <Container>
          <Card>
            <CardBody className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-sm text-muted">
                Connect your Spotify account to get started.
              </p>
              <ConnectButton />
            </CardBody>
          </Card>
        </Container>
      </main>
    </div>
  );
}

function ErrorDashboard({ message }: { message: string }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <DashboardHeader
        right={
          <Link
            href="/api/auth/login"
            className="rounded-full border border-border bg-surface/60 px-4 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-2"
          >
            Reconnect
          </Link>
        }
      />
      <main className="flex-1 py-8">
        <Container>
          <ErrorBanner
            title="Couldn't load your Spotify data"
            description={message}
          />
        </Container>
      </main>
    </div>
  );
}

/* ------------------------------ primitives ------------------------------- */

function Panel<T>({
  title,
  subtitle,
  section,
  render,
  isEmpty,
  emptyMessage,
}: {
  title: string;
  subtitle: string;
  section: Section<T>;
  render: (data: T) => React.ReactNode;
  isEmpty: (data: T) => boolean;
  emptyMessage: string;
}) {
  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      <CardBody>
        {section.ok ? (
          isEmpty(section.data) ? (
            <EmptyState message={emptyMessage} />
          ) : (
            render(section.data)
          )
        ) : (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {section.error}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function RankedList({
  items,
  footer,
  numbered = true,
}: {
  items: { key: string; primary: string; secondary?: string }[];
  footer?: string;
  numbered?: boolean;
}) {
  return (
    <div>
      <ol className="space-y-2.5">
        {items.map((item, i) => (
          <li key={item.key} className="flex items-baseline gap-3">
            {numbered ? (
              <span className="w-4 shrink-0 text-right text-xs tabular-nums text-subtle">
                {i + 1}
              </span>
            ) : (
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/60" />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm text-foreground">{item.primary}</p>
              {item.secondary ? (
                <p className="truncate text-xs text-subtle">{item.secondary}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
      {footer ? (
        <p className="mt-3 border-t border-border pt-2 text-[11px] text-subtle">
          {footer}
        </p>
      ) : null}
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </span>
      <span className="text-xs text-subtle">{label}</span>
    </div>
  );
}

/* -------------------------------- utils ---------------------------------- */

/** Compact relative time like "3m", "2h", "5d" from an ISO timestamp. */
function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
