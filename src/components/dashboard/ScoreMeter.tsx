/** A single 0–100 score with a progress bar and caption. */
export function ScoreMeter({
  score,
  caption,
  detail,
}: {
  score: number;
  caption: string;
  detail?: string;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-semibold tracking-tight text-foreground">
          {score}
        </span>
        <span className="text-xs text-subtle">/ 100</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-accent/80 transition-all"
          style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted">{caption}</p>
      {detail ? <p className="mt-0.5 text-[11px] text-subtle">{detail}</p> : null}
    </div>
  );
}
