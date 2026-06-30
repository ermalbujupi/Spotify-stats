import { redirect } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Wordmark } from "@/components/brand/Wordmark";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { ConnectButton } from "@/components/auth/ConnectButton";
import { ProfileCard } from "@/components/auth/ProfileCard";
import { getSession, isExpired } from "@/lib/auth/session";
import {
  fetchProfile,
  SpotifyAuthError,
  type SpotifyUserProfile,
} from "@/lib/spotify/profile";

/**
 * Dashboard (Phase 2).
 * Server Component: reads the encrypted session, transparently refreshes an
 * expired token (via the refresh route, since RSCs can't write cookies), and
 * fetches the user's profile. Renders a connected or "connect" state.
 */
const TIME_RANGES = ["4 weeks", "6 months", "12 months"] as const;

const PANELS: { title: string; subtitle: string; phase: string }[] = [
  { title: "Top artists", subtitle: "Your most-played artists", phase: "Phase 4" },
  { title: "Top tracks", subtitle: "Your most-played songs", phase: "Phase 4" },
  { title: "Top genres", subtitle: "Derived from your artists", phase: "Phase 4" },
  { title: "Recently played", subtitle: "Your last 50 plays", phase: "Phase 4" },
  { title: "Eras & decades", subtitle: "From album release dates", phase: "Phase 5" },
  { title: "Inferred vibes", subtitle: "Estimated from metadata", phase: "Phase 5" },
];

export default async function DashboardPage() {
  const session = await getSession();

  // Not connected → render the shell with a connect prompt.
  if (!session) {
    return <DashboardShell state={{ kind: "disconnected" }} />;
  }

  // Expired access token → bounce through the refresh route, then come back.
  if (isExpired(session)) {
    redirect("/api/auth/refresh?returnTo=/dashboard");
  }

  // Fetch the profile; handle auth + generic errors distinctly.
  let profile: SpotifyUserProfile;
  try {
    profile = await fetchProfile(session.accessToken);
  } catch (err) {
    if (err instanceof SpotifyAuthError) {
      redirect("/api/auth/refresh?returnTo=/dashboard");
    }
    return (
      <DashboardShell
        state={{
          kind: "error",
          message:
            err instanceof Error
              ? err.message
              : "Couldn't load your Spotify profile.",
        }}
      />
    );
  }

  return <DashboardShell state={{ kind: "connected", profile }} />;
}

type ShellState =
  | { kind: "disconnected" }
  | { kind: "error"; message: string }
  | { kind: "connected"; profile: SpotifyUserProfile };

function DashboardShell({ state }: { state: ShellState }) {
  const connected = state.kind === "connected";

  return (
    <div className="flex min-h-dvh flex-col">
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

            {connected ? (
              <ProfileCard profile={state.profile} />
            ) : (
              <Link
                href="/api/auth/login"
                className="rounded-full border border-border bg-surface/60 px-4 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-2"
              >
                Connect
              </Link>
            )}
          </div>
        </Container>
      </header>

      <main className="flex-1 py-8">
        <Container>
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight">
              {connected
                ? `Welcome${
                    state.profile.display_name
                      ? `, ${state.profile.display_name}`
                      : ""
                  }`
                : "Your dashboard"}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {connected
                ? "You're connected. Live data lands in Phase 3–4."
                : "Connect Spotify to populate this with your real listening data."}
            </p>
          </div>

          {state.kind === "error" ? (
            <div className="mb-6">
              <ErrorBanner
                title="Couldn't load your Spotify data"
                description={state.message}
              />
            </div>
          ) : null}

          {state.kind === "disconnected" ? (
            <Card className="mb-6">
              <CardBody className="flex flex-col items-center gap-3 py-10 text-center">
                <p className="text-sm text-muted">
                  Connect your Spotify account to get started.
                </p>
                <ConnectButton />
              </CardBody>
            </Card>
          ) : null}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PANELS.map((panel) => (
              <Card key={panel.title}>
                <CardHeader
                  title={panel.title}
                  subtitle={panel.subtitle}
                  action={
                    <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-subtle">
                      {panel.phase}
                    </span>
                  }
                />
                <CardBody>
                  <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border/70 text-xs text-subtle">
                    Coming soon
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </Container>
      </main>
    </div>
  );
}
