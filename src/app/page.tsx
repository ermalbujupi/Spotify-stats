import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Wordmark } from "@/components/brand/Wordmark";
import { ConnectButton } from "@/components/auth/ConnectButton";
import { ErrorBanner } from "@/components/ui/ErrorBanner";

/** Friendly copy for OAuth error codes surfaced via the URL. */
const ERROR_TITLES: Record<string, string> = {
  access_denied: "Spotify connection was cancelled",
  invalid_state: "Login could not be verified",
  missing_verifier: "Your login session expired",
  token_exchange_failed: "Couldn't complete sign-in",
  session_expired: "Your session expired",
  config: "App is not configured yet",
};

const FEATURES: { title: string; body: string }[] = [
  {
    title: "Top artists & tracks",
    body: "Your most-played, across the last month, six months, and year.",
  },
  {
    title: "Genres & eras",
    body: "See the genres that define you and which decades you live in.",
  },
  {
    title: "Inferred vibes",
    body: "Chill, energetic, nostalgic and more — estimated from your taste.",
  },
  {
    title: "Diversity & repeats",
    body: "How wide your taste runs and which favorites you keep returning to.",
  },
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; error_description?: string }>;
}) {
  const { error, error_description } = await searchParams;
  const errorTitle = error
    ? (ERROR_TITLES[error] ?? "Something went wrong")
    : null;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="py-6">
        <Container className="flex items-center justify-between">
          <Wordmark />
          <Link
            href="/dashboard"
            className="rounded-full border border-border px-4 py-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground"
          >
            Open dashboard
          </Link>
        </Container>
      </header>

      <main className="flex flex-1 flex-col">
        <Container className="flex flex-1 flex-col items-center justify-center py-16 text-center">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            A private, personal listening dashboard
          </span>

          <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            Understand your{" "}
            <span className="text-accent">music taste</span>, beautifully.
          </h1>

          <p className="mt-5 max-w-xl text-pretty text-base text-muted sm:text-lg">
            Connect Spotify to explore your top artists, tracks, genres, eras,
            and inferred vibes — in a clean dashboard built just for you.
          </p>

          {errorTitle ? (
            <div className="mt-6 w-full max-w-md">
              <ErrorBanner title={errorTitle} description={error_description} />
            </div>
          ) : null}

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <ConnectButton />
            <span className="text-xs text-subtle">
              Secure login via Spotify. We only request read access.
            </span>
          </div>

          <div className="mt-16 grid w-full max-w-4xl grid-cols-1 gap-3 text-left sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-[var(--radius-card)] border border-border bg-surface/60 p-4"
              >
                <h2 className="text-sm font-semibold text-foreground">
                  {f.title}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-subtle">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </main>

      <footer className="py-8">
        <Container className="flex flex-col items-center gap-1 text-center">
          <p className="text-xs text-subtle">
            Your data stays in your browser session. We request only the Spotify
            permissions needed to show your stats.
          </p>
          <p className="text-xs text-subtle/70">
            Not affiliated with Spotify. Built for personal use.
          </p>
        </Container>
      </footer>
    </div>
  );
}
