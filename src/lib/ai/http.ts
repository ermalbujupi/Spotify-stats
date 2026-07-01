import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { SpotifyAuthError } from "@/lib/spotify/errors";

/** Shared HTTP error mapping for the AI routes — most specific first. */
export function mapAiError(err: unknown): NextResponse {
  if (err instanceof SpotifyAuthError) {
    return NextResponse.json(
      { error: "Your Spotify session expired. Refresh the page to reconnect." },
      { status: 401 },
    );
  }
  if (err instanceof Anthropic.AuthenticationError) {
    return NextResponse.json(
      { error: "The Anthropic API key is invalid. Check ANTHROPIC_API_KEY in .env.local." },
      { status: 503 },
    );
  }
  if (err instanceof Anthropic.RateLimitError) {
    return NextResponse.json(
      { error: "The AI is rate-limited right now — try again in a minute." },
      { status: 429 },
    );
  }
  if (err instanceof Anthropic.APIError) {
    return NextResponse.json(
      { error: `AI request failed (${err.status ?? "unknown"}). Try again shortly.` },
      { status: 502 },
    );
  }
  const message =
    err instanceof Error ? err.message : "Something went wrong.";
  return NextResponse.json({ error: message }, { status: 500 });
}

/** 503 when ANTHROPIC_API_KEY is missing. */
export function aiNotConfiguredResponse(): NextResponse {
  return NextResponse.json(
    {
      error:
        "AI features aren't configured. Add ANTHROPIC_API_KEY to .env.local and restart the dev server.",
    },
    { status: 503 },
  );
}

/** 401 for a missing/expired Spotify session. */
export function sessionExpiredResponse(): NextResponse {
  return NextResponse.json(
    { error: "Your Spotify session expired. Refresh the page to reconnect." },
    { status: 401 },
  );
}
