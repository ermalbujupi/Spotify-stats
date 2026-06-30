import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Wordmark } from "@/components/brand/Wordmark";

/**
 * Landing page (Phase 1).
 * The "Connect Spotify" action is a placeholder link to the dashboard for now;
 * it will be wired to the real OAuth login route in Phase 2.
 */
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

export default function Home() {
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

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.02] active:scale-100"
            >
              Connect Spotify
            </Link>
            <span className="text-xs text-subtle">
              Auth arrives in Phase 2 — this previews the dashboard for now.
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
