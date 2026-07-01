import type { PlayHistory, SimplifiedPlaylist, Track } from "@/lib/spotify/types";
import { releaseYear } from "./eras";

/**
 * Vibe / mood inference — a TRANSPARENT HEURISTIC, not audio analysis.
 *
 * Spotify removed audio-features (danceability/energy/valence) and returns no
 * genres for this app, so real mood data is unavailable. Instead we infer a
 * rough "vibe" from signals we DO have:
 *   - playlist names/descriptions (the strongest signal — people name playlists
 *     "chill vibes", "gym", "sad songs", etc.) → weighted heavily
 *   - track / album / artist names → weighted lightly
 *   - release era → feeds "nostalgic"
 *   - time-of-day of recent plays → feeds "late night"
 *
 * Every result is an approximation and must be labeled as such in the UI.
 * Pure function.
 */

export interface VibeScore {
  key: string;
  label: string;
  emoji: string;
  weight: number;
  percent: number; // share of total signal
}

export interface VibeResult {
  vibes: VibeScore[]; // sorted desc, nonzero, capped
  totalSignals: number;
  lowConfidence: boolean; // true when there's little evidence
}

export interface VibeInput {
  topTracks: Track[];
  playlists: SimplifiedPlaylist[];
  recentPlays: PlayHistory[];
}

interface VibeDef {
  key: string;
  label: string;
  emoji: string;
  keywords: string[];
}

/** Keyword lexicon per vibe. Kept small and intentional. */
const VIBES: VibeDef[] = [
  {
    key: "chill",
    label: "Chill",
    emoji: "🌿",
    keywords: ["chill", "relax", "calm", "lofi", "lo-fi", "mellow", "sleep", "ambient", "soft", "slow", "acoustic", "unplugged", "easy", "dreamy", "lounge"],
  },
  {
    key: "energetic",
    label: "Energetic",
    emoji: "⚡",
    keywords: ["hype", "energy", "workout", "gym", "pump", "power", "beast", "run", "running", "fire", "banger", "adrenaline", "hard", "boost"],
  },
  {
    key: "party",
    label: "Party",
    emoji: "🎉",
    keywords: ["party", "dance", "club", "weekend", "friday", "fiesta", "rave", "disco", "turn up", "night out"],
  },
  {
    key: "romantic",
    label: "Romantic",
    emoji: "💘",
    keywords: ["love", "heart", "kiss", "baby", "valentine", "romance", "crush", "forever", "sweet", "honey", "lover"],
  },
  {
    key: "melancholy",
    label: "Melancholy",
    emoji: "🌧",
    keywords: ["sad", "cry", "alone", "lonely", "blue", "tears", "broken", "hurt", "pain", "miss", "empty", "sorrow", "heartbreak"],
  },
  {
    key: "nostalgic",
    label: "Nostalgic",
    emoji: "📼",
    keywords: ["throwback", "classic", "classics", "old", "retro", "memories", "nostalgia", "oldies", "90s", "80s", "2000s", "y2k", "vintage"],
  },
  {
    key: "focus",
    label: "Focus",
    emoji: "🎯",
    keywords: ["focus", "study", "instrumental", "piano", "concentrate", "deep", "coding", "work", "reading", "productivity"],
  },
  {
    key: "summer",
    label: "Summer",
    emoji: "☀️",
    keywords: ["summer", "beach", "sun", "tropical", "vacation", "holiday", "island", "palm", "sunshine"],
  },
];

/** Counts keyword hits: whole-word for single terms, substring for phrases. */
function countMatches(text: string, keywords: string[]): number {
  const words = new Set(text.split(/[^a-z0-9]+/).filter(Boolean));
  let hits = 0;
  for (const kw of keywords) {
    if (kw.includes(" ") || kw.includes("-")) {
      if (text.includes(kw)) hits += 1;
    } else if (words.has(kw)) {
      hits += 1;
    }
  }
  return hits;
}

export function inferVibes(input: VibeInput): VibeResult {
  const weights = new Map<string, number>(VIBES.map((v) => [v.key, 0]));
  const add = (key: string, amount: number) =>
    weights.set(key, (weights.get(key) ?? 0) + amount);

  // Playlist names/descriptions — the strongest, most intentional signal.
  for (const playlist of input.playlists) {
    const text = `${playlist.name} ${playlist.description ?? ""}`.toLowerCase();
    for (const vibe of VIBES) {
      add(vibe.key, countMatches(text, vibe.keywords) * 3);
    }
  }

  // Track/album/artist names — a weak but real signal.
  for (const track of input.topTracks) {
    const text = `${track.name} ${track.album.name} ${track.artists
      .map((a) => a.name)
      .join(" ")}`.toLowerCase();
    for (const vibe of VIBES) {
      add(vibe.key, countMatches(text, vibe.keywords));
    }
  }

  // Era → nostalgic (tracks ~20+ years old).
  const currentYear = new Date().getFullYear();
  let oldTracks = 0;
  for (const track of input.topTracks) {
    const year = releaseYear(track);
    if (year != null && year <= currentYear - 20) oldTracks += 1;
  }
  add("nostalgic", Math.round(oldTracks / 2));

  // Late-night listening → chill (folds pattern data into the vibe mix).
  const nightPlays = input.recentPlays.filter((p) => {
    const hour = new Date(p.played_at).getHours();
    return hour >= 22 || hour < 6;
  }).length;
  add("chill", Math.min(Math.round(nightPlays / 4), 8));

  const totalSignals = [...weights.values()].reduce((s, w) => s + w, 0);

  const vibes: VibeScore[] = VIBES.map((v) => {
    const weight = weights.get(v.key) ?? 0;
    return {
      key: v.key,
      label: v.label,
      emoji: v.emoji,
      weight,
      percent: totalSignals ? Math.round((weight / totalSignals) * 100) : 0,
    };
  })
    .filter((v) => v.weight > 0)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 6);

  return {
    vibes,
    totalSignals,
    // Under a handful of signals, the inference is basically guessing.
    lowConfidence: totalSignals < 4,
  };
}
