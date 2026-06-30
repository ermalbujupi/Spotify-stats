/** Neutral placeholder for a panel with no data to show. */
export function EmptyState({
  message = "Nothing here yet.",
}: {
  message?: string;
}) {
  return (
    <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border/70 px-4 text-center text-xs text-subtle">
      {message}
    </div>
  );
}
