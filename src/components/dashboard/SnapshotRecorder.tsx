"use client";

import { useEffect } from "react";
import { maybeRecordSnapshot, type SnapshotPayload } from "@/lib/history/snapshot";

/** Fired after a new snapshot is written, so the history panel can refresh. */
export const HISTORY_UPDATED_EVENT = "spotify-stats:history-updated";

/**
 * Invisible client component: records today's snapshot into IndexedDB (once per
 * day per range) when the dashboard mounts. Silent on any storage failure.
 */
export function SnapshotRecorder({ payload }: { payload: SnapshotPayload }) {
  useEffect(() => {
    let cancelled = false;
    maybeRecordSnapshot(payload)
      .then((wrote) => {
        if (wrote && !cancelled) {
          window.dispatchEvent(new Event(HISTORY_UPDATED_EVENT));
        }
      })
      .catch(() => {
        /* storage unavailable / private mode — ignore */
      });
    return () => {
      cancelled = true;
    };
    // Re-run when the range changes (each range keeps its own snapshot).
  }, [payload]);

  return null;
}
