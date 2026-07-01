"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { InfoHint } from "@/components/ui/InfoHint";
import type { TwinPersona } from "@/lib/ai/twin";

/**
 * Your Music Twin (Phase 11).
 *
 * Summons a fictional persona distilled from the user's taste, then chats
 * with them over a streaming route. Button-triggered (billable), persisted in
 * sessionStorage per range, clearly labeled as AI fiction.
 */

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

type State =
  | { kind: "idle" }
  | { kind: "summoning" }
  | { kind: "error"; message: string }
  | { kind: "ready"; persona: TwinPersona };

export function TwinCard({ range }: { range: string }) {
  const personaKey = `twin:persona:${range}`;
  const chatKey = `twin:chat:${range}`;

  const [state, setState] = useState<State>({ kind: "idle" });
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [replying, setReplying] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Restore persona + chat for this range.
  useEffect(() => {
    try {
      const p = sessionStorage.getItem(personaKey);
      if (p) {
        setState({ kind: "ready", persona: JSON.parse(p) as TwinPersona });
        const c = sessionStorage.getItem(chatKey);
        setChat(c ? (JSON.parse(c) as ChatMessage[]) : []);
        return;
      }
    } catch {
      /* ignore bad cache */
    }
    setState({ kind: "idle" });
    setChat([]);
  }, [personaKey, chatKey]);

  // Keep the chat scrolled to the latest message.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [chat, replying]);

  const persistChat = useCallback(
    (messages: ChatMessage[]) => {
      try {
        sessionStorage.setItem(chatKey, JSON.stringify(messages));
      } catch {
        /* fine */
      }
    },
    [chatKey],
  );

  const summon = useCallback(
    async (fresh: boolean) => {
      setState({ kind: "summoning" });
      setChatError(null);
      try {
        const res = await fetch(
          `/api/ai/twin?range=${range}${fresh ? "&fresh=1" : ""}`,
          { method: "POST" },
        );
        const body = (await res.json()) as {
          persona?: TwinPersona;
          error?: string;
        };
        if (!res.ok || !body.persona) {
          setState({
            kind: "error",
            message: body.error ?? "Couldn't summon your twin.",
          });
          return;
        }
        try {
          sessionStorage.setItem(personaKey, JSON.stringify(body.persona));
          sessionStorage.removeItem(chatKey);
        } catch {
          /* fine */
        }
        setChat([]);
        setState({ kind: "ready", persona: body.persona });
      } catch {
        setState({ kind: "error", message: "Network error — is the dev server running?" });
      }
    },
    [range, personaKey, chatKey],
  );

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || replying || state.kind !== "ready") return;

    const withUser: ChatMessage[] = [...chat, { role: "user", content: text }];
    setChat(withUser);
    persistChat(withUser);
    setInput("");
    setReplying(true);
    setChatError(null);

    try {
      const res = await fetch(`/api/ai/twin/chat?range=${range}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: withUser }),
      });

      if (!res.ok || !res.body) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        // 409 = persona cache expired server-side; re-summon transparently.
        if (res.status === 409) {
          setChatError("Your twin needed re-summoning — try sending again.");
          await summon(false);
        } else {
          setChatError(body?.error ?? "The twin didn't answer. Try again.");
        }
        setReplying(false);
        return;
      }

      // Stream the reply into a growing assistant message.
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistant = "";
      setChat([...withUser, { role: "assistant", content: "" }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistant += decoder.decode(value, { stream: true });
        setChat([...withUser, { role: "assistant", content: assistant }]);
      }
      const finalChat: ChatMessage[] = [
        ...withUser,
        { role: "assistant", content: assistant },
      ];
      setChat(finalChat);
      persistChat(finalChat);
    } catch {
      setChatError("Connection dropped mid-reply. Try again.");
    } finally {
      setReplying(false);
    }
  }, [input, replying, state, chat, range, persistChat, summon]);

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="👯 Your Music Twin"
        subtitle="A fictional persona distilled from your taste — chat with them"
        action={
          <InfoHint text="Claude invents a fictional character from your listening profile, then role-plays them in chat. Entirely AI-generated fiction — any resemblance to you is the point." />
        }
      />
      <CardBody>
        {state.kind === "idle" ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="max-w-md text-sm text-muted">
              Somewhere out there is a person who listens to exactly what you
              listen to. Want to meet them?
            </p>
            <ActionButton onClick={() => summon(false)} label="Summon my twin" />
          </div>
        ) : null}

        {state.kind === "summoning" ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
            <p className="text-sm text-muted">Distilling a soul from your queue…</p>
          </div>
        ) : null}

        {state.kind === "error" ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="max-w-md text-sm text-red-200">{state.message}</p>
            <ActionButton onClick={() => summon(false)} label="Try again" />
          </div>
        ) : null}

        {state.kind === "ready" ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            {/* Persona panel */}
            <div className="lg:col-span-2">
              <div className="flex items-baseline gap-2">
                <h3 className="text-xl font-semibold tracking-tight text-foreground">
                  {state.persona.name}
                </h3>
                <span className="text-sm text-subtle">{state.persona.age}</span>
              </div>
              <p className="mt-0.5 text-xs italic text-accent">
                “{state.persona.tagline}”
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {state.persona.bio}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {state.persona.traits.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-border bg-surface/60 px-2.5 py-1 text-[11px] text-muted"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs text-subtle">
                Friday night: <span className="text-muted">{state.persona.hangout}</span>
              </p>
              <p className="mt-1 text-xs text-subtle">
                Hot take: <span className="text-muted">{state.persona.hotTake}</span>
              </p>
              <button
                type="button"
                onClick={() => summon(true)}
                className="mt-4 text-[11px] text-subtle transition-colors hover:text-foreground"
              >
                Summon a different twin
              </button>
            </div>

            {/* Chat panel */}
            <div className="flex flex-col lg:col-span-3">
              <div
                ref={scrollRef}
                className="h-64 space-y-2 overflow-y-auto rounded-lg border border-border bg-base/40 p-3"
              >
                {chat.length === 0 ? (
                  <p className="pt-2 text-center text-xs text-subtle">
                    Say hi — {state.persona.name} already knows your whole library.
                  </p>
                ) : (
                  chat.map((m, i) => (
                    <div
                      key={i}
                      className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <span
                        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-1.5 text-sm leading-relaxed ${
                          m.role === "user"
                            ? "bg-accent/15 text-foreground"
                            : "bg-surface-2 text-foreground"
                        }`}
                      >
                        {m.content || "…"}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {chatError ? (
                <p className="mt-2 text-xs text-red-200">{chatError}</p>
              ) : null}

              <form
                className="mt-2 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void send();
                }}
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Message ${state.persona.name}…`}
                  maxLength={2000}
                  className="flex-1 rounded-full border border-border bg-surface/60 px-4 py-2 text-sm text-foreground placeholder:text-subtle focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                />
                <button
                  type="submit"
                  disabled={replying || input.trim().length === 0}
                  className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-black transition-transform enabled:hover:scale-[1.03] disabled:opacity-40"
                >
                  {replying ? "…" : "Send"}
                </button>
              </form>
              <p className="mt-1.5 text-[10px] text-subtle">
                AI-generated fictional character · not a real person
              </p>
            </div>
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}

function ActionButton({
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
