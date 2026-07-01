/**
 * Tiny in-memory TTL cache shared by the AI routes. Module-level, so all
 * route handlers in the same server runtime see the same instance.
 * Fine for a personal dev-mode app; resets on server restart.
 */

import type { SommelierResult } from "./sommelier";
import type { TwinPersona } from "./twin";

export class TtlCache<T> {
  private map = new Map<string, { value: T; expiresAt: number }>();

  constructor(private readonly ttlMs: number) {}

  get(key: string): T | null {
    const entry = this.map.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.map.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: T): void {
    this.map.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  delete(key: string): void {
    this.map.delete(key);
  }
}

const SIX_HOURS = 1000 * 60 * 60 * 6;

/** Keyed by `${spotifyUserId}:${range}`. */
export const sommelierCache = new TtlCache<SommelierResult>(SIX_HOURS);
export const twinCache = new TtlCache<TwinPersona>(SIX_HOURS);
