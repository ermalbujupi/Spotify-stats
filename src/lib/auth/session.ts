import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { decryptJSON, encryptJSON } from "./crypto";

/**
 * Session model + cookie plumbing for the Spotify OAuth flow.
 *
 * - `SESSION_COOKIE` holds the encrypted token set (httpOnly, never read by JS).
 * - `VERIFIER_COOKIE` / `STATE_COOKIE` are short-lived, used only between the
 *   login redirect and the callback.
 */

export const SESSION_COOKIE = "spotify_session";
export const VERIFIER_COOKIE = "spotify_pkce_verifier";
export const STATE_COOKIE = "spotify_oauth_state";

/** Seconds of headroom before `expiresAt` at which we treat the token as stale. */
const EXPIRY_BUFFER_S = 60;

export interface SpotifySession {
  accessToken: string;
  refreshToken: string;
  /** Unix epoch seconds when the access token expires. */
  expiresAt: number;
  scope: string;
}

const isProd = process.env.NODE_ENV === "production";

/** Shared cookie options. `secure` is disabled in dev so cookies work over http://127.0.0.1. */
const baseCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax" as const,
  path: "/",
};

export function isExpired(session: SpotifySession): boolean {
  return Date.now() / 1000 >= session.expiresAt - EXPIRY_BUFFER_S;
}

/** Reads + decrypts the session in a Server Component / Server Action context. */
export async function getSession(): Promise<SpotifySession | null> {
  const store = await cookies();
  return decryptJSON<SpotifySession>(store.get(SESSION_COOKIE)?.value);
}

/** Writes the encrypted session cookie onto a route response. */
export function setSessionCookie(res: NextResponse, session: SpotifySession): void {
  res.cookies.set(SESSION_COOKIE, encryptJSON(session), {
    ...baseCookieOptions,
    // Persist across browser restarts up to the refresh token's practical life.
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE, "", { ...baseCookieOptions, maxAge: 0 });
}

/** Sets the short-lived PKCE verifier + state cookies during login. */
export function setLoginCookies(
  res: NextResponse,
  verifier: string,
  state: string,
): void {
  const opts = { ...baseCookieOptions, maxAge: 60 * 10 }; // 10 minutes
  res.cookies.set(VERIFIER_COOKIE, verifier, opts);
  res.cookies.set(STATE_COOKIE, state, opts);
}

export function clearLoginCookies(res: NextResponse): void {
  res.cookies.set(VERIFIER_COOKIE, "", { ...baseCookieOptions, maxAge: 0 });
  res.cookies.set(STATE_COOKIE, "", { ...baseCookieOptions, maxAge: 0 });
}
