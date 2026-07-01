"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { InfoHint } from "@/components/ui/InfoHint";
import type { SommelierResult } from "@/lib/ai/sommelier";

/**
 * AI Music Sommelier (Phase 10).
 *
 * Button-triggered (AI calls are billable — never fired on page load), cached
 * in sessionStorage per range so revisits within the tab are free. All output
 * is labeled as AI-generated inference.
 */

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "done"; result: SommelierResult };

const LOADING_LINES = [
  "Swirling the glass…",
  "Checking the vintage…",
  "Sniffing the bouquet of your playlists…",
  "Consulting the cellar…",
];

export function SommelierCard({ range }: { range: string }) {
  const storageKey = `sommelier:${range}`;
  const [state, setState] = useState<State>({ kind: "idle" });
  const [loadingLine, setLoadingLine] = useState(LOADING_LINES[0]);

  // Restore a cached result for this range (and reset when range changes).
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(storageKey);
      if (cached) {
        setState({ kind: "done", result: JSON.parse(cached) as SommelierResult });
        return;
      }
    } catch {
      /* ignore bad cache */
    }
    setState({ kind: "idle" });
  }, [storageKey]);

  // Rotate the loading line for flavor.
  useEffect(() => {
    if (state.kind !== "loading") return;
    const id = setInterval(() => {
      setLoadingLine(
        LOADING_LINES[Math.floor(Math.random() * LOADING_LINES.length)],
      );
    }, 2500);
    return () => clearInterval(id);
  }, [state.kind]);

  const generate = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const res = await fetch(`/api/ai/sommelier?range=${range}`, {
        method: "POST",
      });
      const body = (await res.json()) as {
        result?: SommelierResult;
        error?: string;
      };
      if (!res.ok || !body.result) {
        setState({
          kind: "error",
          message: body.error ?? "Couldn't generate your review.",
        });
        return;
      }
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(body.result));
      } catch {
        /* storage full/blocked — fine */
      }
      setState({ kind: "done", result: body.result });
    } catch {
      setState({ kind: "error", message: "Network error — is the dev server running?" });
    }
  }, [range, storageKey]);

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="🍷 The Music Sommelier"
        subtitle="An AI review of your taste — genres restored by Claude"
        action={
          <InfoHint text="Spotify's API no longer provides genres or moods, so Claude infers them from your artist & track names, then writes your tasting note. AI-generated — expect the occasional wrong vintage." />
        }
      />
      <CardBody>
        {state.kind === "idle" ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="max-w-md text-sm text-muted">
              Let the sommelier taste your listening — real genres, detected
              scenes, and a review of your palate.
            </p>
            <GenerateButton onClick={generate} label="Uncork my taste" />
          </div>
        ) : null}

        {state.kind === "loading" ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
            <p className="text-sm text-muted">{loadingLine}</p>
          </div>
        ) : null}

        {state.kind === "error" ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="max-w-md text-sm text-red-200">{state.message}</p>
            <GenerateButton onClick={generate} label="Try again" />
          </div>
        ) : null}

        {state.kind === "done" ? (
          <SommelierResultView result={state.result} onRegenerate={generate} />
        ) : null}
      </CardBody>
    </Card>
  );
}

function GenerateButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-black transition-transform hover:scale-[1.02] active:scale-100"
    >
      {label}
    </button>
  );
}

function SommelierResultView({
  result,
  onRegenerate,
}: {
  result: SommelierResult;
  onRegenerate: () => void;
}) {
  const genres = result.genreRanking.slice(0, 8);
  const maxPercent = Math.max(...genres.map((g) => g.percent), 1);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Tasting note */}
      <div>
        <p className="text-xs uppercase tracking-wide text-subtle">
          Tasting note
        </p>
        <blockquote className="mt-2 border-l-2 border-accent/60 pl-4 text-sm leading-relaxed text-foreground">
          {result.tastingNote}
        </blockquote>

        <div className="mt-4 flex flex-wrap gap-2">
          {result.vibeWords.map((w) => (
            <span
              key={w}
              className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs text-accent"
            >
              {w}
            </span>
          ))}
        </div>

        {result.scenes.length > 0 ? (
          <p className="mt-4 text-xs text-muted">
            Detected scenes:{" "}
            <span className="text-foreground">{result.scenes.join(" · ")}</span>
          </p>
        ) : null}
      </div>

      {/* AI genre ranking */}
      <div>
        <p className="text-xs uppercase tracking-wide text-subtle">
          Your genres, restored
        </p>
        <ul className="mt-2 space-y-2">
          {genres.map((g) => (
            <li key={g.genre} className="flex items-center gap-3">
              <span className="w-32 shrink-0 truncate text-xs text-foreground">
                {g.genre}
              </span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-accent/80"
                  style={{ width: `${(g.percent / maxPercent) * 100}%` }}
                />
              </div>
              <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-subtle">
                {Math.round(g.percent)}%
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-2">
          <p className="text-[11px] text-subtle">
            AI-inferred from artist names ·{" "}
            {result.confidence === "high"
              ? "high confidence"
              : result.confidence === "medium"
                ? "medium confidence"
                : "low confidence"}
          </p>
          <button
            type="button"
            onClick={onRegenerate}
            className="text-[11px] text-subtle transition-colors hover:text-foreground"
          >
            Regenerate
          </button>
        </div>
      </div>
    </div>
  );
}
