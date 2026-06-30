import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForSession } from "@/lib/auth/tokens";
import {
  clearLoginCookies,
  setSessionCookie,
  STATE_COOKIE,
  VERIFIER_COOKIE,
} from "@/lib/auth/session";

/**
 * OAuth redirect target. Validates `state`, exchanges the authorization code
 * for tokens via PKCE, stores the encrypted session, and sends the user to the
 * dashboard. All failure paths land back on the landing page with an error.
 */
export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
  const url = request.nextUrl;

  const error = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const verifier = request.cookies.get(VERIFIER_COOKIE)?.value;
  const expectedState = request.cookies.get(STATE_COOKIE)?.value;

  // User denied consent or Spotify returned an error.
  if (error) {
    return redirectWithError(appUrl, "access_denied", error);
  }

  // CSRF / integrity checks.
  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectWithError(
      appUrl,
      "invalid_state",
      "Login could not be verified. Please try again.",
    );
  }
  if (!verifier) {
    return redirectWithError(
      appUrl,
      "missing_verifier",
      "Your login session expired. Please try again.",
    );
  }

  try {
    const session = await exchangeCodeForSession(code, verifier);
    const res = NextResponse.redirect(new URL("/dashboard", appUrl));
    setSessionCookie(res, session);
    clearLoginCookies(res);
    return res;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to complete login.";
    return redirectWithError(appUrl, "token_exchange_failed", message);
  }
}

function redirectWithError(
  appUrl: string,
  code: string,
  description: string,
): NextResponse {
  const target = new URL("/", appUrl);
  target.searchParams.set("error", code);
  target.searchParams.set("error_description", description);
  const res = NextResponse.redirect(target);
  clearLoginCookies(res);
  return res;
}
