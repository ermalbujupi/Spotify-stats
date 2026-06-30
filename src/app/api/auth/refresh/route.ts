import { NextRequest, NextResponse } from "next/server";
import { refreshSession } from "@/lib/auth/tokens";
import {
  clearSessionCookie,
  getSession,
  setSessionCookie,
} from "@/lib/auth/session";

/**
 * Refreshes the access token and redirects back to `returnTo` (default
 * `/dashboard`). Server Components can't write cookies, so when a page detects
 * an expired token it redirects here to perform the refresh, then bounces back.
 *
 * On failure the session is cleared and the user is sent home to re-connect.
 */
export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
  const returnTo = sanitizeReturnTo(request.nextUrl.searchParams.get("returnTo"));

  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/", appUrl));
  }

  try {
    const refreshed = await refreshSession(session);
    const res = NextResponse.redirect(new URL(returnTo, appUrl));
    setSessionCookie(res, refreshed);
    return res;
  } catch {
    const target = new URL("/", appUrl);
    target.searchParams.set("error", "session_expired");
    target.searchParams.set(
      "error_description",
      "Your Spotify session expired. Please reconnect.",
    );
    const res = NextResponse.redirect(target);
    clearSessionCookie(res);
    return res;
  }
}

/** Only allow same-app relative paths as redirect targets. */
function sanitizeReturnTo(value: string | null): string {
  if (value && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return "/dashboard";
}
