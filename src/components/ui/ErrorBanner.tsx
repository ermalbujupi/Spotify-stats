/** Inline, dismissible-looking error banner (presentational). */
export function ErrorBanner({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-[var(--radius-card)] border border-red-500/30 bg-red-500/10 px-4 py-3 text-left"
    >
      <span aria-hidden className="mt-0.5 text-red-400">
        ⚠
      </span>
      <div>
        <p className="text-sm font-medium text-red-200">{title}</p>
        {description ? (
          <p className="mt-0.5 text-xs text-red-200/70">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
