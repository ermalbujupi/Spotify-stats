import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getSession, isExpired } from "@/lib/auth/session";
import { createSpotifyClient } from "@/lib/spotify/client";
import { SpotifyAuthError } from "@/lib/spotify/errors";
import { parseTimeRange, timeRangeLongLabel } from "@/lib/timeRange";
import { releaseYear } from "@/lib/insights/eras";
import {
  generateSommelier,
  isAiConfigured,
  type SommelierResult,
} from "@/lib/ai/sommelier";

/**
 * POST /api/ai/sommelier?range=medium_term
 *
 * Fetches the user's Spotify profile server-side (client input is never
 * trusted for the payload), asks Claude for the enrichment + tasting note,
 * and caches the result per user + range so repeat clicks are free.
 *
 * POST (not GET) because it triggers billable work.
 */

interface CacheEntry {
  result: SommelierResult;
  expiresAt: number;
}

/** In-memory cache — fine for a personal dev-mode app; resets on restart. */
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6h — taste doesn't shift mid-day

export async function POST(request: NextRequest) {
  if (!isAiConfigured()) {
    return NextResponse.json(
      {
        error:
          "AI features aren't configured. Add ANTHROPIC_API_KEY to .env.local and restart the dev server.",
      },
      { status: 503 },
    );
  }

  const session = await getSession();
  if (!session || isExpired(session)) {
    return NextResponse.json(
      { error: "Your Spotify session expired. Refresh the page to reconnect." },
      { status: 401 },
    );
  }

  const range = parseTimeRange(
    request.nextUrl.searchParams.get("range") ?? undefined,
  );

  try {
    const spotify = createSpotifyClient(session.accessToken);

    // Profile id keys the cache (and never reaches the AI prompt).
    const profile = await spotify.getProfile();
    const cacheKey = `${profile.id}:${range}`;

    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json({ result: cached.result, cached: true });
    }

    const [artistsPage, tracksPage, playlists] = await Promise.all([
      spotify.getTopArtists({ timeRange: range, limit: 50 }),
      spotify.getTopTracks({ timeRange: range, limit: 50 }),
      spotify.getPlaylists(50),
    ]);

    if (artistsPage.items.length === 0 && tracksPage.items.length === 0) {
      return NextResponse.json(
        { error: "Not enough listening history in this range yet." },
        { status: 422 },
      );
    }

    const result = await generateSommelier({
      rangeLabel: timeRangeLongLabel(range).toLowerCase(),
      topArtists: artistsPage.items.map((a) => a.name),
      topTracks: tracksPage.items.map((t) => ({
        name: t.name,
        artist: t.artists[0]?.name ?? "Unknown",
        year: releaseYear(t),
      })),
      playlistNames: playlists.map((p) => p.name),
    });

    cache.set(cacheKey, { result, expiresAt: Date.now() + CACHE_TTL_MS });
    return NextResponse.json({ result, cached: false });
  } catch (err) {
    return mapError(err);
  }
}

function mapError(err: unknown): NextResponse {
  if (err instanceof SpotifyAuthError) {
    return NextResponse.json(
      { error: "Your Spotify session expired. Refresh the page to reconnect." },
      { status: 401 },
    );
  }
  // Anthropic typed errors, most specific first.
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
    err instanceof Error ? err.message : "Something went wrong generating your review.";
  return NextResponse.json({ error: message }, { status: 500 });
}
