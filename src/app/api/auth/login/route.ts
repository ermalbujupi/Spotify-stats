import { NextResponse } from "next/server";
import {
  getSpotifyConfig,
  SPOTIFY_AUTHORIZE_URL,
  SPOTIFY_SCOPES,
} from "@/lib/spotify/config";
import {
  generateCodeChallenge,
  generateCodeVerifier,
  generateState,
} from "@/lib/auth/pkce";
import { setLoginCookies } from "@/lib/auth/session";

/**
 * Starts the OAuth Authorization Code + PKCE flow:
 * generate verifier/challenge/state, stash verifier+state in short-lived
 * cookies, and redirect the user to Spotify's consent screen.
 */
export async function GET() {
  let config;
  try {
    config = getSpotifyConfig();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Configuration error.";
    return NextResponse.redirect(
      buildErrorUrl("config", message),
    );
  }

  const verifier = generateCodeVerifier();
  const challenge = generateCodeChallenge(verifier);
  const state = generateState();

  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: SPOTIFY_SCOPES.join(" "),
    code_challenge_method: "S256",
    code_challenge: challenge,
    state,
  });

  const res = NextResponse.redirect(`${SPOTIFY_AUTHORIZE_URL}?${params.toString()}`);
  setLoginCookies(res, verifier, state);
  return res;
}

function buildErrorUrl(code: string, message: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://127.0.0.1:3000";
  const url = new URL("/", base);
  url.searchParams.set("error", code);
  url.searchParams.set("error_description", message);
  return url.toString();
}
