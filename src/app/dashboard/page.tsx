import { redirect } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Wordmark } from "@/components/brand/Wordmark";
import { Card, CardBody } from "@/components/ui/Card";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { ConnectButton } from "@/components/auth/ConnectButton";
import { ProfileCard } from "@/components/auth/ProfileCard";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { ArtistGrid } from "@/components/dashboard/ArtistGrid";
import { TrackList } from "@/components/dashboard/TrackList";
import { RecentlyPlayedList } from "@/components/dashboard/RecentlyPlayedList";
import { DecadeBars } from "@/components/dashboard/DecadeBars";
import { LibrarySummary } from "@/components/dashboard/LibrarySummary";
import { TimeOfDayBars } from "@/components/dashboard/TimeOfDayBars";
import { RepeatsList } from "@/components/dashboard/RepeatsList";
import { StatTile } from "@/components/dashboard/StatTile";
import { getSession, isExpired } from "@/lib/auth/session";
import { fetchProfile } from "@/lib/spotify/profile";
import { SpotifyAuthError } from "@/lib/spotify/errors";
import {
  loadDashboardData,
  type DashboardData,
  type Section,
} from "@/lib/spotify/dashboard-data";
import { decadeBreakdown, type DecadeBucket } from "@/lib/insights/eras";
import { summarizeLibrary, type LibrarySummary as LibrarySummaryData } from "@/lib/insights/library";
import {
  timeOfDayBreakdown,
  repeatedTracks,
  activeDays,
  peakPeriod,
  type PeriodBucket,
  type RepeatedTrack,
} from "@/lib/insights/patterns";
import type { SpotifyUserProfile } from "@/lib/spotify/types";

/**
 * Dashboard (Phase 5).
 * Extends Phase 4 with listening-pattern insights derived from recently-played:
 * time-of-day distribution, tracks on repeat, and active-day counts.
 */

const TIME_RANGES = ["4 weeks", "6 months", "12 months"] as const;

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return <DisconnectedDashboard />;
  if (isExpired(session)) redirect("/api/auth/refresh?returnTo=/dashboard");

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
          err instanceof Error ? err.message : "Couldn't load your Spotify data."
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
  // Insight layer — all pure, no additional fetches.
  const erasSection: Section<DecadeBucket[]> = data.topTracks.ok
    ? { ok: true, data: decadeBreakdown(data.topTracks.data) }
    : data.topTracks;

  const librarySection: Section<LibrarySummaryData> =
    data.playlists.ok && data.savedTracks.ok
      ? {
          ok: true,
          data: summarizeLibrary(
            data.playlists.data,
            data.savedTracks.data.total,
            profile.id,
          ),
        }
      : {
          ok: false,
          error: !data.playlists.ok
            ? data.playlists.error
            : (data.savedTracks as { error: string }).error,
        };

  // Phase 5 pattern insights from recently-played.
  const recentPlays = sectionData(data.recentlyPlayed) ?? [];
  const timeOfDaySection: Section<PeriodBucket[]> =
    data.recentlyPlayed.ok
      ? { ok: true, data: timeOfDayBreakdown(recentPlays) }
      : data.recentlyPlayed;
  const repeatsSection: Section<RepeatedTrack[]> =
    data.recentlyPlayed.ok
      ? { ok: true, data: repeatedTracks(recentPlays) }
      : data.recentlyPlayed;

  // Headline stats (defensive — any section may have failed).
  const topArtist = sectionData(data.topArtists)?.[0]?.name ?? "—";
  const likedSongs = sectionData(data.savedTracks)?.total ?? null;
  const playlistCount = sectionData(data.playlists)?.length ?? null;
  const decadesSpanned = sectionData(erasSection)?.length ?? null;
  const daysActive = recentPlays.length > 0 ? activeDays(recentPlays) : null;
  const peakTime = timeOfDaySection.ok
    ? (peakPeriod(timeOfDaySection.data) ?? null)
    : null;

  return (
    <div className="flex min-h-dvh flex-col">
      <DashboardHeader right={<ProfileCard profile={profile} />} />

      <main className="flex-1 py-8">
        <Container className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome{profile.display_name ? `, ${profile.display_name}` : ""}
            </h1>
            <p className="mt-1 text-sm text-muted">
              Your listening at a glance · last 6 months
            </p>
          </div>

          {/* Headline stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            <StatTile value={topArtist} label="Top artist" />
            <StatTile
              value={likedSongs !== null ? likedSongs.toLocaleString() : "—"}
              label="Liked songs"
            />
            <StatTile
              value={playlistCount !== null ? String(playlistCount) : "—"}
              label="Playlists"
            />
            <StatTile
              value={decadesSpanned !== null ? String(decadesSpanned) : "—"}
              label="Decades spanned"
            />
            <StatTile
              value={daysActive !== null ? String(daysActive) : "—"}
              label="Active days (recent)"
            />
            <StatTile
              value={peakTime ?? "—"}
              label="Peak listening time"
            />
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <SectionCard
              title="Top artists"
              subtitle="Last 6 months"
              section={data.topArtists}
              isEmpty={(a) => a.length === 0}
              emptyMessage="No top artists yet — keep listening."
              className="lg:col-span-2"
            >
              {(artists) => <ArtistGrid artists={artists} limit={10} />}
            </SectionCard>

            <SectionCard
              title="Recently played"
              subtitle="Your last 50 plays"
              section={data.recentlyPlayed}
              isEmpty={(p) => p.length === 0}
              emptyMessage="Nothing played recently."
              className="lg:col-span-1"
            >
              {(plays) => <RecentlyPlayedList plays={plays} limit={8} />}
            </SectionCard>

            <SectionCard
              title="Top tracks"
              subtitle="Last 6 months"
              section={data.topTracks}
              isEmpty={(t) => t.length === 0}
              emptyMessage="No top tracks yet."
              className="lg:col-span-2"
            >
              {(tracks) => <TrackList tracks={tracks} limit={10} />}
            </SectionCard>

            <SectionCard
              title="Eras & decades"
              subtitle="From album release dates"
              section={erasSection}
              isEmpty={(b) => b.length === 0}
              emptyMessage="Not enough release-date data."
              className="lg:col-span-1"
            >
              {(buckets) => <DecadeBars buckets={buckets} />}
            </SectionCard>

            <SectionCard
              title="When you listen"
              subtitle="From your last 50 plays"
              section={timeOfDaySection}
              isEmpty={(b) => b.length === 0}
              emptyMessage="Not enough recent plays to analyse."
              className="lg:col-span-1"
            >
              {(buckets) => <TimeOfDayBars buckets={buckets} />}
            </SectionCard>

            <SectionCard
              title="On repeat"
              subtitle="Tracks you played more than once recently"
              section={repeatsSection}
              isEmpty={(t) => t.length === 0}
              emptyMessage="No tracks repeated in your last 50 plays."
              className="lg:col-span-2"
            >
              {(tracks) => <RepeatsList tracks={tracks} />}
            </SectionCard>

            <SectionCard
              title="Library & playlists"
              subtitle="Your saved music and collections"
              section={librarySection}
              className="lg:col-span-3"
            >
              {(summary) => <LibrarySummary data={summary} />}
            </SectionCard>
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

/* -------------------------------- utils ---------------------------------- */

/** Safely unwrap a section's data, or null if it failed. */
function sectionData<T>(section: Section<T>): T | null {
  return section.ok ? section.data : null;
}
