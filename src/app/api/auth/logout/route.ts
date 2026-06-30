import { NextRequest, NextResponse } from "next/server";
import { clearLoginCookies, clearSessionCookie } from "@/lib/auth/session";

/**
 * Logs out by clearing the session cookie and returning to the landing page.
 * Spotify has no token-revocation endpoint for public clients, so logout is a
 * local cookie clear; the refresh token simply stops being used.
 */
export async function GET(request: NextRequest) {
  return handleLogout(request);
}

export async function POST(request: NextRequest) {
  return handleLogout(request);
}

function handleLogout(request: NextRequest): NextResponse {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
  const res = NextResponse.redirect(new URL("/", appUrl));
  clearSessionCookie(res);
  clearLoginCookies(res);
  return res;
}
