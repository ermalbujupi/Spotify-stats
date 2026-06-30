import { getSpotifyConfig, SPOTIFY_TOKEN_URL } from "@/lib/spotify/config";
import type { SpotifySession } from "./session";

/**
 * Token endpoint interactions for the PKCE flow. No client secret is used.
 */

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  scope?: string;
  expires_in: number;
  refresh_token?: string;
}

function toSession(
  data: SpotifyTokenResponse,
  fallbackRefreshToken?: string,
): SpotifySession {
  const refreshToken = data.refresh_token ?? fallbackRefreshToken;
  if (!refreshToken) {
    // Should not happen on the initial exchange; guards against a malformed response.
    throw new Error("Spotify did not return a refresh token.");
  }
  return {
    accessToken: data.access_token,
    refreshToken,
    expiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
    scope: data.scope ?? "",
  };
}

/** Exchanges an authorization code for tokens (initial login). */
export async function exchangeCodeForSession(
  code: string,
  codeVerifier: string,
): Promise<SpotifySession> {
  const { clientId, redirectUri } = getSpotifyConfig();

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: codeVerifier,
  });

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Token exchange failed (${res.status}): ${detail}`);
  }

  return toSession((await res.json()) as SpotifyTokenResponse);
}

/**
 * Refreshes an access token. Spotify may or may not rotate the refresh token;
 * we keep the existing one when a new one isn't returned.
 */
export async function refreshSession(
  current: SpotifySession,
): Promise<SpotifySession> {
  const { clientId } = getSpotifyConfig();

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: current.refreshToken,
    client_id: clientId,
  });

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Token refresh failed (${res.status}): ${detail}`);
  }

  return toSession((await res.json()) as SpotifyTokenResponse, current.refreshToken);
}
