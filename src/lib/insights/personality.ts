import type { DiversityResult } from "./diversity";
import type { DiscoveryResult } from "./discovery";
import type { VibeScore } from "./vibes";

/**
 * "Music personality" — a friendly, rule-based summary that weaves together the
 * other (approximate) insights into a single archetype. Not a scientific claim;
 * it's a fun synthesis of diversity, discovery, vibe, era, and timing.
 * Pure function.
 */

export interface PersonalityTrait {
  label: string;
  value: string;
}

export interface Personality {
  title: string;
  description: string;
  traits: PersonalityTrait[];
}

export interface PersonalityInput {
  diversity: DiversityResult | null;
  discovery: DiscoveryResult | null;
  topVibe: VibeScore | null;
  peakPeriodLabel: string | null;
  topDecadeLabel: string | null;
}

/** Adjective from how much fresh vs. familiar music you play. */
function discoveryArchetype(discovery: DiscoveryResult | null): string {
  if (!discovery || discovery.total === 0) return "Listener";
  if (discovery.discoveryPercent >= 55) return "Explorer";
  if (discovery.discoveryPercent <= 30) return "Devotee";
  return "Curator";
}

/** Modifier from how spread-out vs. concentrated your artists are. */
function diversityModifier(diversity: DiversityResult | null): string {
  if (!diversity || diversity.totalTracks === 0) return "";
  if (diversity.score >= 70) return "Eclectic";
  if (diversity.score <= 40) return "Devoted";
  return "Well-Rounded";
}

export function buildPersonality(input: PersonalityInput): Personality {
  const { diversity, discovery, topVibe, peakPeriodLabel, topDecadeLabel } =
    input;

  const modifier = diversityModifier(diversity);
  const archetype = discoveryArchetype(discovery);
  const title = ["The", modifier, archetype].filter(Boolean).join(" ");

  const parts: string[] = [];
  if (topVibe) {
    parts.push(`Your listening leans ${topVibe.label.toLowerCase()} ${topVibe.emoji}`);
  }
  if (topDecadeLabel) {
    parts.push(`with a ${topDecadeLabel} heart`);
  }
  if (peakPeriodLabel) {
    parts.push(`and you come alive in the ${peakPeriodLabel.toLowerCase()}`);
  }
  const description =
    parts.length > 0
      ? `${parts.join(", ")}.`
      : "Connect a bit more listening history to reveal your music personality.";

  const traits: PersonalityTrait[] = [];
  if (diversity && diversity.totalTracks > 0) {
    traits.push({ label: "Diversity", value: `${diversity.score}/100` });
  }
  if (discovery && discovery.total > 0) {
    traits.push({ label: "Discovery", value: `${discovery.discoveryPercent}%` });
  }
  if (topVibe) {
    traits.push({ label: "Top vibe", value: `${topVibe.emoji} ${topVibe.label}` });
  }
  if (topDecadeLabel) {
    traits.push({ label: "Signature era", value: topDecadeLabel });
  }
  if (peakPeriodLabel) {
    traits.push({ label: "Peak time", value: peakPeriodLabel });
  }

  return { title, description, traits };
}
