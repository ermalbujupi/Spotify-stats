/** Small brand wordmark with a minimal equalizer glyph. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        aria-hidden
        className="inline-flex h-6 w-6 items-end justify-center gap-[2px] rounded-md bg-accent/15 px-1 py-1 text-accent"
      >
        <span className="h-2 w-[3px] rounded-full bg-accent" />
        <span className="h-4 w-[3px] rounded-full bg-accent" />
        <span className="h-3 w-[3px] rounded-full bg-accent" />
      </span>
      <span className="text-sm font-semibold tracking-tight text-foreground">
        Spotify Stats
      </span>
    </span>
  );
}
