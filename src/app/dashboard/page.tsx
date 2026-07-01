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
import { ListeningClock } from "@/components/dashboard/ListeningClock";
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
import { artistDiversity, type DiversityResult } from "@/lib/insights/diversity";
import { discoveryVsComfort, type DiscoveryResult } from "@/lib/insights/discovery";
import { inferVibes, type VibeResult } from "@/lib/insights/vibes";
import { buildPersonality } from "@/lib/insights/personality";
import { hourlyBreakdown, type HourBucket } from "@/lib/insights/timeline";
import { ScoreMeter } from "@/components/dashboard/ScoreMeter";
import { DiscoveryDonut } from "@/components/dashboard/DiscoveryDonut";
import { VibeRadar } from "@/components/dashboard/VibeRadar";
import { PersonalityCard } from "@/components/dashboard/PersonalityCard";
import { SommelierCard } from "@/components/dashboard/SommelierCard";
import { TwinCard } from "@/components/dashboard/TwinCard";
import { PrivacyNote } from "@/components/dashboard/PrivacyNote";
import { HistoryPanel } from "@/components/dashboard/HistoryPanel";
import { SnapshotRecorder } from "@/components/dashboard/SnapshotRecorder";
import { TimeRangeToggle } from "@/components/dashboard/TimeRangeToggle";
import type { SnapshotPayload } from "@/lib/history/snapshot";
import { parseTimeRange, timeRangeLongLabel } from "@/lib/timeRange";
import type { SpotifyUserProfile, TimeRange } from "@/lib/spotify/types";

/**
 * Dashboard (Phase 7).
 * Adds time-range support: `?range=` selects the top-items window, driving a
 * server-side re-fetch of top artists/tracks and everything derived from them.
 */

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range: rangeParam } = await searchParams;
  const range = parseTimeRange(rangeParam);
  const returnTo = encodeURIComponent(`/dashboard?range=${range}`);

  const session = await getSession();
  if (!session) return <DisconnectedDashboard />;
  if (isExpired(session)) {
    redirect(`/api/auth/refresh?returnTo=${returnTo}`);
  }

  let profile: SpotifyUserProfile;
  let data: DashboardData;
  try {
    profile = await fetchProfile(session.accessToken);
    data = await loadDashboardData(session.accessToken, { timeRange: range });
  } catch (err) {
    if (err instanceof SpotifyAuthError) {
      redirect(`/api/auth/refresh?returnTo=${returnTo}`);
    }
    return (
      <ErrorDashboard
        message={
          err instanceof Error ? err.message : "Couldn't load your Spotify data."
        }
      />
    );
  }

  return <ConnectedDashboard profile={profile} data={data} range={range} />;
}

/* ----------------------------- header shell ------------------------------ */

function DashboardHeader({
  right,
  range,
}: {
  right: React.ReactNode;
  range?: TimeRange;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-base/70 py-4 backdrop-blur-md">
      <Container className="flex flex-wrap items-center gap-3">
        <Link href="/" className="mr-auto">
          <Wordmark />
        </Link>
        {/* On mobile the toggle drops to its own full-width row. */}
        {range ? (
          <div className="order-last w-full sm:order-none sm:w-auto">
            <TimeRangeToggle active={range} />
          </div>
        ) : null}
        {right}
      </Container>
    </header>
  );
}

/* --------------------------- connected variant --------------------------- */

function ConnectedDashboard({
  profile,
  data,
  range,
}: {
  profile: SpotifyUserProfile;
  data: DashboardData;
  range: TimeRange;
}) {
  const rangeLabel = timeRangeLongLabel(range);

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
  // Phase 6: per-hour distribution for the radial listening clock.
  const hourlySection: Section<HourBucket[]> = data.recentlyPlayed.ok
    ? { ok: true, data: hourlyBreakdown(recentPlays) }
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

  // Phase 5 (continued): taste diversity, discovery, vibes, personality.
  const topTracksArr = sectionData(data.topTracks) ?? [];
  const topArtistsArr = sectionData(data.topArtists) ?? [];
  const playlistsArr = sectionData(data.playlists) ?? [];

  const diversitySection: Section<DiversityResult> = data.topTracks.ok
    ? { ok: true, data: artistDiversity(topTracksArr) }
    : data.topTracks;

  const discoverySection: Section<DiscoveryResult> =
    data.recentlyPlayed.ok && data.topTracks.ok && data.topArtists.ok
      ? {
          ok: true,
          data: discoveryVsComfort(recentPlays, topTracksArr, topArtistsArr),
        }
      : {
          ok: false,
          error: "Couldn't compute discovery — some data failed to load.",
        };

  const vibesSection: Section<VibeResult> =
    data.topTracks.ok && data.playlists.ok
      ? {
          ok: true,
          data: inferVibes({
            topTracks: topTracksArr,
            playlists: playlistsArr,
            recentPlays,
          }),
        }
      : {
          ok: false,
          error: "Couldn't infer vibes — some data failed to load.",
        };

  // Labels feeding the "music personality" synthesis.
  const erasBuckets = sectionData(erasSection) ?? [];
  const topDecadeLabel = erasBuckets.length
    ? erasBuckets.reduce((a, b) => (b.count > a.count ? b : a)).label
    : null;
  const peakBucket =
    timeOfDaySection.ok && timeOfDaySection.data.length
      ? timeOfDaySection.data.reduce((a, b) => (b.count > a.count ? b : a))
      : null;
  const peakLabel = peakBucket && peakBucket.count > 0 ? peakBucket.label : null;

  const personality = buildPersonality({
    diversity: sectionData(diversitySection),
    discovery: sectionData(discoverySection),
    topVibe: sectionData(vibesSection)?.vibes[0] ?? null,
    peakPeriodLabel: peakLabel,
    topDecadeLabel,
  });

  // Phase 9: compact payload the client records into IndexedDB (once/day/range).
  const snapshotPayload: SnapshotPayload = {
    range,
    topArtists: topArtistsArr.slice(0, 20).map((a) => ({ id: a.id, name: a.name })),
    topTracks: topTracksArr.slice(0, 20).map((t) => ({ id: t.id, name: t.name })),
    diversityScore: sectionData(diversitySection)?.score ?? null,
    topVibe: sectionData(vibesSection)?.vibes[0]?.label ?? null,
    likedSongs,
    playlistCount,
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <DashboardHeader
        right={<ProfileCard profile={profile} />}
        range={range}
      />

      <main className="flex-1 py-8">
        <Container className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome{profile.display_name ? `, ${profile.display_name}` : ""}
            </h1>
            <p className="mt-1 text-sm text-muted">
              Your listening at a glance · {rangeLabel.toLowerCase()}
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

          {/* Music personality */}
          <div className="animate-fade-up">
            <PersonalityCard data={personality} />
          </div>

          {/* AI Music Sommelier (Phase 10) — button-triggered, per-range */}
          <SommelierCard range={range} />

          {/* Your Music Twin (Phase 11) — persona + streaming chat */}
          <TwinCard range={range} />

          {/* Main grid */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <SectionCard
              title="Top artists"
              subtitle={rangeLabel}
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
              subtitle={rangeLabel}
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
              info="Groups your top tracks by the decade their album was released. Based on your top 50 tracks for the selected range."
              className="lg:col-span-1"
            >
              {(buckets) => <DecadeBars buckets={buckets} />}
            </SectionCard>

            <SectionCard
              title="When you listen"
              subtitle="Your last 50 plays, by hour"
              section={hourlySection}
              isEmpty={(h) => h.every((x) => x.count === 0)}
              emptyMessage="Not enough recent plays to analyse."
              info="Hour-of-day distribution of your most recent ~50 plays, in your local time. A recent snapshot, not long-term behaviour."
              className="lg:col-span-1"
            >
              {(hours) => <ListeningClock hours={hours} />}
            </SectionCard>

            <SectionCard
              title="On repeat"
              subtitle="Tracks you played more than once recently"
              section={repeatsSection}
              isEmpty={(t) => t.length === 0}
              emptyMessage="No tracks repeated in your last 50 plays."
              info="Tracks that appear more than once within your last ~50 plays — Spotify only exposes that many."
              className="lg:col-span-2"
            >
              {(tracks) => <RepeatsList tracks={tracks} />}
            </SectionCard>

            <SectionCard
              title="Your vibes"
              subtitle="Inferred from names, era & timing"
              section={vibesSection}
              info="Approximate. Spotify no longer exposes audio mood or genres, so vibes are inferred from playlist & track names, release era, and listening time."
              className="lg:col-span-2"
            >
              {(v) => <VibeRadar data={v} />}
            </SectionCard>

            <SectionCard
              title="Taste diversity"
              subtitle="Variety across your top tracks"
              section={diversitySection}
              info="How many distinct artists appear across your top tracks. 100 = every track a different artist; lower = a few artists dominate."
              className="lg:col-span-1"
            >
              {(d) => (
                <ScoreMeter
                  score={d.score}
                  caption={d.caption}
                  detail={`${d.distinctArtists} artists across ${d.totalTracks} top tracks`}
                />
              )}
            </SectionCard>

            <SectionCard
              title="Discovery vs comfort"
              subtitle="New music vs your favorites"
              section={discoverySection}
              isEmpty={(d) => d.total === 0}
              emptyMessage="No recent plays to analyze."
              info="Approximate. Of your last ~50 plays, how many are outside your top tracks/artists (discovery) vs. within them (comfort)."
              className="lg:col-span-3"
            >
              {(d) => <DiscoveryDonut data={d} />}
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

          <HistoryPanel range={range} />
          <SnapshotRecorder payload={snapshotPayload} />

          <PrivacyNote />
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
