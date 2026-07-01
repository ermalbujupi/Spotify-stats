/**
 * A small "?" affordance with a hover/focus tooltip. Pure CSS (group-hover +
 * focus-within) so it needs no client JS and works in Server Components.
 * Used to explain what a metric means and, crucially, when it's an approximation.
 */
export function InfoHint({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <span
        tabIndex={0}
        role="note"
        aria-label={text}
        className="flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-border text-[9px] text-subtle transition-colors hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
      >
        ?
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute right-0 top-6 z-30 hidden w-56 rounded-lg border border-border bg-surface-2 p-2.5 text-[11px] leading-relaxed text-muted shadow-xl group-hover:block group-focus-within:block"
      >
        {text}
      </span>
    </span>
  );
}
