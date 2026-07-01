import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { SommelierInput, SommelierResult } from "./sommelier";

/**
 * Your Music Twin (Phase 11).
 *
 * Claude synthesizes a fictional persona from the listener's taste profile
 * (optionally enriched by a cached Sommelier result), then role-plays that
 * persona in a streaming chat. Server-side only; clearly labeled AI fiction.
 */

export const TWIN_MODEL = "claude-opus-4-8";

/* ------------------------------- persona --------------------------------- */

export const TwinPersonaSchema = z.object({
  // Owner preference: regional flavor may color the bio/traits, but NOT the name.
  name: z.string().describe("A fitting first name for this persona. Do NOT use Albanian names — pick a common international/Western first name regardless of any regional flavor in the taste."),
  age: z.number().describe("Their age, inferred from the eras and scenes in the taste."),
  tagline: z.string().describe("A one-line self-description, under 12 words, in their voice."),
  bio: z.string().describe("2-3 sentences about who they are — habits, contradictions, where the music shows up in their life. Third person. Affectionately specific, never generic."),
  traits: z.array(z.string()).describe("Exactly 4 short quirky traits (2-5 words each, e.g. 'buys vinyl he never plays')."),
  hangout: z.string().describe("Where you'd find them on a Friday night, one short phrase."),
  hotTake: z.string().describe("One spicy but defensible music opinion consistent with this taste, one sentence, first person."),
  chatStyle: z.string().describe("2-3 sentences of instructions describing HOW this persona talks in chat: register, slang, energy, pet phrases. Written as instructions, not examples."),
});

export type TwinPersona = z.infer<typeof TwinPersonaSchema>;

/* ----------------------------- generation -------------------------------- */

/**
 * Generates the persona from the same server-fetched profile the Sommelier
 * uses, enriched with the Sommelier's genre/scene analysis when available.
 */
export async function generateTwinPersona(
  input: SommelierInput,
  enrichment: SommelierResult | null,
): Promise<TwinPersona> {
  const client = new Anthropic();

  const enrichmentBlock = enrichment
    ? `\nAN EARLIER AI ANALYSIS OF THIS TASTE:\n` +
      `Genres: ${enrichment.genreRanking.map((g) => g.genre).join(", ")}\n` +
      `Scenes: ${enrichment.scenes.join(", ") || "none detected"}\n` +
      `Vibe: ${enrichment.vibeWords.join(", ")}\n`
    : "";

  const response = await client.messages.parse({
    model: TWIN_MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system:
      "You are a brilliant character writer who can read a person's soul from their music library. " +
      "You create a FICTIONAL persona — the person this music taste conjures — that is uncannily specific: " +
      "real-feeling habits, contradictions, and regional texture drawn from the actual artists, eras, and playlist names. " +
      "Never generic, never mean-spirited; the reader should laugh and say 'that's literally me'.",
    messages: [
      {
        role: "user",
        content:
          `Create the music twin for this listener (${input.rangeLabel}).\n\n` +
          `TOP ARTISTS (rank order):\n${input.topArtists.slice(0, 30).map((a, i) => `${i + 1}. ${a}`).join("\n")}\n\n` +
          `TOP TRACKS:\n${input.topTracks.slice(0, 20).map((t) => `- "${t.name}" — ${t.artist}${t.year ? ` (${t.year})` : ""}`).join("\n")}\n\n` +
          `THEIR PLAYLIST NAMES:\n${input.playlistNames.slice(0, 25).join(" · ") || "(none)"}\n` +
          enrichmentBlock,
      },
    ],
    output_config: {
      format: zodOutputFormat(TwinPersonaSchema),
    },
  });

  if (!response.parsed_output) {
    throw new Error("The AI persona could not be parsed.");
  }
  return response.parsed_output;
}

/* -------------------------------- chat ----------------------------------- */

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

/** Builds the stable system prompt the twin chats under. */
export function buildTwinSystemPrompt(
  persona: TwinPersona,
  input: SommelierInput,
  enrichment: SommelierResult | null,
): string {
  return (
    `You are ${persona.name}, ${persona.age} — a fictional "music twin" persona generated from a real person's Spotify taste. ` +
    `The person you're chatting with is the listener you were distilled from, so their favorite artists are also yours.\n\n` +
    `WHO YOU ARE:\n${persona.bio}\nTagline: "${persona.tagline}"\n` +
    `Traits: ${persona.traits.join("; ")}\nFriday night: ${persona.hangout}\n` +
    `A hot take you hold: ${persona.hotTake}\n\n` +
    `YOUR (SHARED) MUSIC WORLD:\nTop artists: ${input.topArtists.slice(0, 25).join(", ")}\n` +
    (enrichment
      ? `Genres: ${enrichment.genreRanking.map((g) => g.genre).join(", ")}\nScenes: ${enrichment.scenes.join(", ") || "—"}\n`
      : "") +
    `\nHOW YOU TALK:\n${persona.chatStyle}\n\n` +
    `RULES:\n` +
    `- Stay in character. Talk music, life, opinions — like a friend with identical taste.\n` +
    `- Keep replies short: 1-4 sentences unless genuinely asked for more.\n` +
    `- You may recommend music, but ground it in the shared taste.\n` +
    `- You know you're an AI-generated fictional twin; if asked directly, own it with charm, then carry on in character.\n` +
    `- Never claim real-world abilities (playing music, accessing accounts).`
  );
}

/**
 * Streams a chat reply as raw text. Caller pipes it to the HTTP response.
 */
export function streamTwinReply(
  persona: TwinPersona,
  input: SommelierInput,
  enrichment: SommelierResult | null,
  turns: ChatTurn[],
) {
  const client = new Anthropic();
  return client.messages.stream({
    model: TWIN_MODEL,
    max_tokens: 1024, // chat replies are short by design
    thinking: { type: "adaptive" },
    system: buildTwinSystemPrompt(persona, input, enrichment),
    messages: turns,
  });
}
