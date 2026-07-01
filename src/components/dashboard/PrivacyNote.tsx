/**
 * Privacy disclosure shown at the foot of the dashboard. Explains, plainly,
 * what the app reads and that nothing is persisted server-side.
 */
export function PrivacyNote() {
  return (
    <footer className="mt-8 rounded-[var(--radius-card)] border border-border bg-surface/40 px-5 py-4">
      <h2 className="text-xs font-semibold text-foreground">
        Your privacy
      </h2>
      <p className="mt-1.5 max-w-3xl text-[11px] leading-relaxed text-subtle">
        This dashboard reads your Spotify data (profile, top artists &amp;
        tracks, recently played, playlists, and saved songs) using{" "}
        <span className="text-muted">read-only</span> permissions, purely to
        display these stats. Nothing is stored on any server: your Spotify tokens
        live only in an encrypted, http-only cookie for your browser session, and
        your listening data is fetched fresh on each visit and never shared with a
        third party. Log out anytime to clear the session.
      </p>
    </footer>
  );
}
