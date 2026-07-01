import {
  getAllSnapshots,
  getSnapshot,
  putSnapshot,
  type StoredSnapshot,
} from "./db";

/**
 * Snapshot domain logic on top of the IndexedDB store.
 *
 * A snapshot captures a compact view of your stats for one day + time range,
 * so the app can build genuine long-term history that Spotify's API can't
 * provide (it caps recent plays at 50 and top items at ~12 months).
 */

/** The compact payload the server hands to the client recorder. */
export interface SnapshotPayload {
  range: string;
  topArtists: { id: string; name: string }[];
  topTracks: { id: string; name: string }[];
  diversityScore: number | null;
  topVibe: string | null;
  likedSongs: number | null;
  playlistCount: number | null;
}

/** Local YYYY-MM-DD (not UTC — matches the user's day). */
export function todayLocal(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function keyFor(date: string, range: string): string {
  return `${date}:${range}`;
}

/**
 * Records today's snapshot for the payload's range if one doesn't already
 * exist. Returns true if a new snapshot was written.
 */
export async function maybeRecordSnapshot(
  payload: SnapshotPayload,
): Promise<boolean> {
  const date = todayLocal();
  const key = keyFor(date, payload.range);

  const existing = await getSnapshot(key);
  if (existing) return false;

  await putSnapshot({
    key,
    date,
    savedAt: new Date().toISOString(),
    ...payload,
  });
  return true;
}

/** All snapshots for a given range, oldest → newest. */
export async function getHistory(range: string): Promise<StoredSnapshot[]> {
  const all = await getAllSnapshots();
  return all
    .filter((s) => s.range === range)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export type { StoredSnapshot };
