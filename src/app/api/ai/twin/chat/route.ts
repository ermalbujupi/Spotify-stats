import { NextRequest, NextResponse } from "next/server";
import { getSession, isExpired } from "@/lib/auth/session";
import { parseTimeRange } from "@/lib/timeRange";
import { isAiConfigured } from "@/lib/ai/sommelier";
import { streamTwinReply, type ChatTurn } from "@/lib/ai/twin";
import { buildProfileInput } from "@/lib/ai/profile-input";
import { sommelierCache, twinCache } from "@/lib/ai/cache";
import {
  aiNotConfiguredResponse,
  mapAiError,
  sessionExpiredResponse,
} from "@/lib/ai/http";

/**
 * POST /api/ai/twin/chat?range=medium_term
 * Body: { messages: [{role: "user"|"assistant", content: string}, ...] }
 *
 * Streams the twin's reply as plain text. The persona and profile come from
 * the server-side caches (regenerating the profile input from Spotify), so
 * the client only supplies the conversation turns.
 */

const MAX_TURNS = 20;
const MAX_TURN_CHARS = 2000;

export async function POST(request: NextRequest) {
  if (!isAiConfigured()) return aiNotConfiguredResponse();

  const session = await getSession();
  if (!session || isExpired(session)) return sessionExpiredResponse();

  const range = parseTimeRange(
    request.nextUrl.searchParams.get("range") ?? undefined,
  );

  // Validate + sanitize the conversation turns.
  let turns: ChatTurn[];
  try {
    const body = (await request.json()) as { messages?: unknown };
    turns = sanitizeTurns(body.messages);
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (turns.length === 0) {
    return NextResponse.json({ error: "Say something first." }, { status: 400 });
  }

  try {
    const { profileId, input } = await buildProfileInput(
      session.accessToken,
      range,
    );
    const cacheKey = `${profileId}:${range}`;

    const persona = twinCache.get(cacheKey);
    if (!persona) {
      return NextResponse.json(
        { error: "Your twin faded away (cache expired). Summon them again first." },
        { status: 409 },
      );
    }
    const enrichment = sommelierCache.get(cacheKey);

    const stream = streamTwinReply(persona, input, enrichment, turns);
    const encoder = new TextEncoder();

    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return mapAiError(err);
  }
}

/** Keep only well-formed turns, cap history and per-turn length, ensure the
 *  conversation starts with a user turn and ends with a user turn. */
function sanitizeTurns(raw: unknown): ChatTurn[] {
  if (!Array.isArray(raw)) return [];
  const turns: ChatTurn[] = [];
  for (const item of raw) {
    if (
      item &&
      typeof item === "object" &&
      "role" in item &&
      "content" in item &&
      (item.role === "user" || item.role === "assistant") &&
      typeof item.content === "string" &&
      item.content.trim().length > 0
    ) {
      turns.push({
        role: item.role,
        content: item.content.slice(0, MAX_TURN_CHARS),
      });
    }
  }
  let recent = turns.slice(-MAX_TURNS);
  // Must start with a user turn (API requirement).
  while (recent.length > 0 && recent[0].role !== "user") recent = recent.slice(1);
  // Must end with a user turn (we're generating the assistant reply).
  while (recent.length > 0 && recent[recent.length - 1].role !== "user") {
    recent = recent.slice(0, -1);
  }
  return recent;
}
