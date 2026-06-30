/** A single headline metric: large value + small label, optional hint. */
export function StatTile({
  value,
  label,
  hint,
}: {
  value: string;
  label: string;
  hint?: string;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-surface/60 px-4 py-3">
      <p className="text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-0.5 text-xs text-muted">{label}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-subtle">{hint}</p> : null}
    </div>
  );
}
