"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { InfoHint } from "@/components/ui/InfoHint";
import { clearSnapshots } from "@/lib/history/db";
import { getHistory, type StoredSnapshot } from "@/lib/history/snapshot";
import { HISTORY_UPDATED_EVENT } from "./SnapshotRecorder";

/**
 * History & trends, read from IndexedDB (client-only). Builds up over time as
 * the SnapshotRecorder saves a daily snapshot per time range.
 */
export function HistoryPanel({ range }: { range: string }) {
  const [snaps, setSnaps] = useState<StoredSnapshot[] | null>(null);

  const load = useCallback(() => {
    getHistory(range)
      .then(setSnaps)
      .catch(() => setSnaps([]));
  }, [range]);

  useEffect(() => {
    load();
    window.addEventListener(HISTORY_UPDATED_EVENT, load);
    return () => window.removeEventListener(HISTORY_UPDATED_EVENT, load);
  }, [load]);

  const handleClear = useCallback(() => {
    clearSnapshots()
      .then(() => setSnaps([]))
      .catch(() => {});
  }, []);

  return (
    <Card>
      <CardHeader
        title="History & trends"
        subtitle="Saved locally in your browser, over time"
        action={
          <InfoHint text="Spotify only exposes recent data, so the app saves a small daily snapshot of your stats in your browser (IndexedDB) to build long-term trends. Nothing leaves your device." />
        }
      />
      <CardBody>
        {snaps === null ? (
          <p className="text-sm text-subtle">Loading your history…</p>
        ) : snaps.length <= 1 ? (
          <FreshState count={snaps.length} />
        ) : (
          <TrendView snaps={snaps} onClear={handleClear} />
        )}
      </CardBody>
    </Card>
  );
}

function FreshState({ count }: { count: number }) {
  return (
    <div className="rounded-lg border border-dashed border-border/70 px-4 py-6 text-center">
      <p className="text-sm text-muted">
        {count === 0
          ? "Starting to track this range now."
          : "Tracking started — one snapshot saved so far."}
      </p>
      <p className="mt-1 text-xs text-subtle">
        Come back on another day to start seeing trends (diversity over time, new
        top artists, and more).
      </p>
    </div>
  );
}

function TrendView({
  snaps,
  onClear,
}: {
  snaps: StoredSnapshot[];
  onClear: () => void;
}) {
  const first = snaps[0];
  const latest = snaps[snaps.length - 1];
  const previous = snaps[snaps.length - 2];

  const prevArtistIds = new Set(previous.topArtists.map((a) => a.id));
  const newArtists = latest.topArtists
    .filter((a) => !prevArtistIds.has(a.id))
    .slice(0, 5);

  const diversitySeries = snaps
    .map((s) => s.diversityScore)
    .filter((v): v is number => v != null);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-subtle">
        <span>
          <span className="text-foreground">{snaps.length}</span> snapshots
        </span>
        <span>
          since <span className="text-foreground">{first.date}</span>
        </span>
      </div>

      {diversitySeries.length >= 2 ? (
        <div>
          <p className="mb-1.5 text-xs text-muted">Diversity over time</p>
          <Sparkline values={diversitySeries} />
        </div>
      ) : null}

      <div>
        <p className="mb-1.5 text-xs text-muted">
          New in your top artists since last snapshot
        </p>
        {newArtists.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {newArtists.map((a) => (
              <span
                key={a.id}
                className="rounded-full border border-border bg-surface/60 px-2.5 py-1 text-xs text-foreground"
              >
                {a.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-subtle">
            No changes at the top — your favorites held steady.
          </p>
        )}
      </div>

      <div className="border-t border-border pt-3">
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-subtle transition-colors hover:text-red-300"
        >
          Clear local history
        </button>
      </div>
    </div>
  );
}

/** Tiny inline SVG line chart (0–100 values). */
function Sparkline({ values }: { values: number[] }) {
  const W = 300;
  const H = 44;
  const pad = 3;
  const n = values.length;
  const points = values.map((v, i) => {
    const x = n === 1 ? W / 2 : (i / (n - 1)) * (W - pad * 2) + pad;
    const y = H - pad - (v / 100) * (H - pad * 2);
    return { x, y };
  });
  const path = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Diversity score over time">
      <polyline
        points={path}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="var(--color-accent)" />
      ))}
    </svg>
  );
}
