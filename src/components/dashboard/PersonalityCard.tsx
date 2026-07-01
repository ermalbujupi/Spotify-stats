import { Card } from "@/components/ui/Card";
import type { Personality } from "@/lib/insights/personality";

/** Hero "music personality" summary — the emotional centerpiece of the dash. */
export function PersonalityCard({ data }: { data: Personality }) {
  return (
    <Card className="overflow-hidden">
      <div className="relative px-6 py-6">
        {/* soft accent glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/10 blur-3xl"
        />
        <p className="text-xs uppercase tracking-wide text-subtle">
          Your music personality
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {data.title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">{data.description}</p>

        {data.traits.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {data.traits.map((trait) => (
              <span
                key={trait.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs"
              >
                <span className="text-subtle">{trait.label}</span>
                <span className="font-medium text-foreground">
                  {trait.value}
                </span>
              </span>
            ))}
          </div>
        ) : null}

        <p className="mt-4 text-[11px] text-subtle">
          A playful synthesis of your stats — approximate, just for fun.
        </p>
      </div>
    </Card>
  );
}
