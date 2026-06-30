import { Container } from "@/components/layout/Container";
import { Wordmark } from "@/components/brand/Wordmark";
import { Card, CardBody } from "@/components/ui/Card";
import { Skeleton, SkeletonRows } from "@/components/ui/Skeleton";

/**
 * Route-level loading UI, shown by Next.js while the dashboard Server Component
 * fetches data. Mirrors the real layout to avoid layout shift.
 */
export default function DashboardLoading() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-base/70 py-4 backdrop-blur-md">
        <Container className="flex items-center justify-between gap-4">
          <Wordmark />
          <Skeleton className="h-8 w-36 rounded-full" />
        </Container>
      </header>

      <main className="flex-1 py-8">
        <Container>
          <div className="mb-6 space-y-2">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-80" />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <div className="border-b border-border px-5 py-4">
                  <Skeleton className="h-4 w-28" />
                </div>
                <CardBody>
                  <SkeletonRows rows={4} />
                </CardBody>
              </Card>
            ))}
          </div>
        </Container>
      </main>
    </div>
  );
}
