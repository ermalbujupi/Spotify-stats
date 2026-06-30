/**
 * Back-compat surface for the Phase 2 profile fetch. The canonical types and
 * client now live in `./types`, `./errors`, and `./client`.
 */
import { createSpotifyClient } from "./client";
import type { SpotifyUserProfile } from "./types";

export { SpotifyAuthError } from "./errors";
export type { SpotifyUserProfile, SpotifyImage } from "./types";

export function fetchProfile(accessToken: string): Promise<SpotifyUserProfile> {
  return createSpotifyClient(accessToken).getProfile();
}
