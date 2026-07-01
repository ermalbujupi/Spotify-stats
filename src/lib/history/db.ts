/**
 * Minimal, dependency-free IndexedDB wrapper for a single "snapshots" store.
 * Browser-only — every function must be called from client code (effects).
 */

const DB_NAME = "spotify-stats";
const STORE = "snapshots";
const VERSION = 1;

export interface StoredSnapshot {
  /** `${date}:${range}` — one snapshot per day per time range. */
  key: string;
  date: string; // local YYYY-MM-DD
  savedAt: string; // ISO timestamp
  range: string;
  topArtists: { id: string; name: string }[];
  topTracks: { id: string; name: string }[];
  diversityScore: number | null;
  topVibe: string | null;
  likedSongs: number | null;
  playlistCount: number | null;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function isAvailable(): boolean {
  return typeof indexedDB !== "undefined";
}

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode);
        const req = run(transaction.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

export async function getSnapshot(
  key: string,
): Promise<StoredSnapshot | undefined> {
  if (!isAvailable()) return undefined;
  return tx<StoredSnapshot | undefined>("readonly", (store) =>
    store.get(key) as IDBRequest<StoredSnapshot | undefined>,
  );
}

export async function putSnapshot(record: StoredSnapshot): Promise<void> {
  if (!isAvailable()) return;
  await tx("readwrite", (store) => store.put(record));
}

export async function getAllSnapshots(): Promise<StoredSnapshot[]> {
  if (!isAvailable()) return [];
  const all = await tx<StoredSnapshot[]>("readonly", (store) =>
    store.getAll() as IDBRequest<StoredSnapshot[]>,
  );
  return all ?? [];
}

export async function clearSnapshots(): Promise<void> {
  if (!isAvailable()) return;
  await tx("readwrite", (store) => store.clear());
}
