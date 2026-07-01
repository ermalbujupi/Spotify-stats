import { NextRequest, NextResponse } from "next/server";
import { getSession, isExpired } from "@/lib/auth/session";
import { parseTimeRange } from "@/lib/timeRange";
import { isAiConfigured } from "@/lib/ai/sommelier";
import { generateTwinPersona } from "@/lib/ai/twin";
import { buildProfileInput } from "@/lib/ai/profile-input";
import { sommelierCache, twinCache } from "@/lib/ai/cache";
import {
  aiNotConfiguredResponse,
  mapAiError,
  sessionExpiredResponse,
} from "@/lib/ai/http";

/**
 * POST /api/ai/twin?range=medium_term[&fresh=1]
 *
 * Generates (or returns the cached) Music Twin persona for the user + range.
 * Reuses a cached Sommelier enrichment when present for a richer persona.
 * `fresh=1` bypasses the cache to roll a new twin.
 */
export async function POST(request: NextRequest) {
  if (!isAiConfigured()) return aiNotConfiguredResponse();

  const session = await getSession();
  if (!session || isExpired(session)) return sessionExpiredResponse();

  const range = parseTimeRange(
    request.nextUrl.searchParams.get("range") ?? undefined,
  );
  const fresh = request.nextUrl.searchParams.get("fresh") === "1";

  try {
    const { profileId, input } = await buildProfileInput(
      session.accessToken,
      range,
    );
    const cacheKey = `${profileId}:${range}`;

    if (!fresh) {
      const cached = twinCache.get(cacheKey);
      if (cached) {
        return NextResponse.json({ persona: cached, cached: true });
      }
    }

    if (input.topArtists.length === 0 && input.topTracks.length === 0) {
      return NextResponse.json(
        { error: "Not enough listening history in this range yet." },
        { status: 422 },
      );
    }

    const enrichment = sommelierCache.get(cacheKey); // may be null — fine
    const persona = await generateTwinPersona(input, enrichment);
    twinCache.set(cacheKey, persona);
    return NextResponse.json({ persona, cached: false });
  } catch (err) {
    return mapAiError(err);
  }
}
