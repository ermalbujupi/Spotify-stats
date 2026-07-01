import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

/**
 * AI Music Sommelier (Phase 10).
 *
 * Spotify's API no longer returns genres, moods, or audio features — but a
 * capable LLM knows who these artists are. One structured-output call to
 * Claude enriches the user's top artists with genres/moods/scenes and writes
 * a sommelier-style "tasting note" for their taste.
 *
 * Server-side only: the Anthropic API key must never reach the client.
 * Output is AI-generated inference from artist/track NAMES — the UI labels it
 * as such.
 */

export const SOMMELIER_MODEL = "claude-opus-4-8";

/* ------------------------------- schema ---------------------------------- */

const EnrichedArtistSchema = z.object({
  name: z.string(),
  genres: z
    .array(z.string())
    .describe("1-3 specific genres for this artist, lowercase (e.g. 'albanian hip hop', 'synthwave'). Empty if genuinely unknown."),
  mood: z
    .string()
    .describe("One dominant mood word for this artist's typical sound (e.g. 'melancholic', 'triumphant')."),
});

export const SommelierResultSchema = z.object({
  artists: z
    .array(EnrichedArtistSchema)
    .describe("One entry per input artist, same order as given."),
  genreRanking: z
    .array(
      z.object({
        genre: z.string(),
        percent: z.number().describe("Approximate share of the listener's taste, 0-100. Should sum to roughly 100."),
      }),
    )
    .describe("Top 6-8 genres across the whole profile, most prominent first."),
  scenes: z
    .array(z.string())
    .describe("0-4 specific scenes/micro-genres or regional scenes detected (e.g. 'Balkan rap', 'UK drill', 'bedroom pop'). Be specific, not generic."),
  vibeWords: z
    .array(z.string())
    .describe("Exactly 3 evocative lowercase words that capture the overall vibe of this taste."),
  tastingNote: z
    .string()
    .describe("A wine-sommelier-style review of this person's music taste: 60-100 words, second person, witty but affectionate, with concrete references to their actual artists/eras. No markdown."),
  confidence: z
    .enum(["high", "medium", "low"])
    .describe("How confident you are overall, given how well you know these artists."),
});

export type SommelierResult = z.infer<typeof SommelierResultSchema>;

/* ------------------------------- input ----------------------------------- */

export interface SommelierInput {
  rangeLabel: string; // e.g. "last 6 months"
  topArtists: string[]; // names, rank order
  topTracks: { name: string; artist: string; year: number | null }[];
  playlistNames: string[];
}

/* -------------------------------- call ----------------------------------- */

export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * One structured-output call: enrichment + tasting note together.
 * Throws Anthropic SDK errors — the route maps them to HTTP responses.
 */
export async function generateSommelier(
  input: SommelierInput,
): Promise<SommelierResult> {
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

  const trackLines = input.topTracks
    .slice(0, 30)
    .map((t) => `- "${t.name}" — ${t.artist}${t.year ? ` (${t.year})` : ""}`)
    .join("\n");

  const response = await client.messages.parse({
    model: SOMMELIER_MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system:
      "You are a music expert with encyclopedic knowledge of artists across every scene, era, and region — and the soul of a wine sommelier. " +
      "You classify artists by genre and mood from your own knowledge of them (the streaming API provides no genre data). " +
      "Only classify artists you actually recognize; for unfamiliar names, return an empty genres array rather than guessing. " +
      "Be specific: 'albanian rap' beats 'hip hop', 'midwest emo' beats 'rock'.",
    messages: [
      {
        role: "user",
        content:
          `Here is a listener's Spotify profile for the ${input.rangeLabel}.\n\n` +
          `TOP ARTISTS (rank order):\n${input.topArtists.map((a, i) => `${i + 1}. ${a}`).join("\n")}\n\n` +
          `TOP TRACKS:\n${trackLines}\n\n` +
          `THEIR PLAYLIST NAMES:\n${input.playlistNames.slice(0, 25).join(" · ") || "(none)"}\n\n` +
          `Enrich this profile (genres, moods, scenes, vibe) and write their tasting note.`,
      },
    ],
    output_config: {
      format: zodOutputFormat(SommelierResultSchema),
    },
  });

  if (!response.parsed_output) {
    throw new Error("The AI response could not be parsed.");
  }
  return response.parsed_output;
}
