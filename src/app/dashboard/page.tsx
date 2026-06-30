import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Wordmark } from "@/components/brand/Wordmark";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

/**
 * Dashboard placeholder (Phase 1).
 * Establishes the layout shell — header, time-range control, and a panel grid —
 * with empty/placeholder states. Real data and auth are wired in later phases.
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

export default function DashboardPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-base/70 py-4 backdrop-blur-md">
        <Container className="flex items-center justify-between gap-4">
          <Link href="/">
            <Wordmark />
          </Link>

          <div className="flex items-center gap-3">
            {/* Time-range control — non-functional placeholder until Phase 7. */}
            <div className="hidden items-center rounded-full border border-border bg-surface/60 p-0.5 sm:flex">
              {TIME_RANGES.map((r, i) => (
                <span
                  key={r}
                  className={`rounded-full px-3 py-1 text-xs ${
                    i === 1
                      ? "bg-surface-2 text-foreground"
                      : "text-subtle"
                  }`}
                >
                  {r}
                </span>
              ))}
            </div>

            {/* Profile slot — becomes the user card in Phase 2. */}
            <div className="flex items-center gap-2 rounded-full border border-border bg-surface/60 px-2 py-1">
              <span className="h-6 w-6 rounded-full bg-surface-2" />
              <span className="pr-1 text-xs text-subtle">Not connected</span>
            </div>
          </div>
        </Container>
      </header>

      <main className="flex-1 py-8">
        <Container>
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight">
              Your dashboard
            </h1>
            <p className="mt-1 text-sm text-muted">
              This is the layout shell. Connect Spotify (Phase 2) to populate it
              with your real listening data.
            </p>
          </div>

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
