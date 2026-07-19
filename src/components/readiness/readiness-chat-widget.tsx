"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { MessageCircleIcon, SendIcon, XIcon } from "lucide-react";

import { saveRuleQuestionAction } from "@/actions/readiness.action";
import { SourceCitationDialog } from "@/components/readiness/source-citation-dialog";
import type { SourceCitation } from "@/features/readiness/domain";
import {
  INITIAL_READINESS_ACTION_STATE,
  type ReadinessActionState,
} from "@/features/readiness/action-state";
import type { ReadinessChatMessage } from "@/features/readiness/chat-messages";
import { cn } from "@/lib/utils";

export type { ReadinessChatMessage } from "@/features/readiness/chat-messages";

const SUGGESTIONS = [
  "How is monthly income annualized?",
  "What does the 60% income limit mean here?",
  "What documents does the checklist look for?",
] as const;

export function ReadinessChatWidget({
  sessionId,
  initialMessages = [],
  sources = [],
  ruleVersion,
  ruleEffectiveDate,
}: {
  sessionId: string;
  initialMessages?: ReadinessChatMessage[];
  sources?: SourceCitation[];
  ruleVersion?: string;
  ruleEffectiveDate?: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ReadinessChatMessage[]>(initialMessages);
  const listRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const handledStateRef = useRef<ReadinessActionState>(INITIAL_READINESS_ACTION_STATE);
  const [isPending, startTransition] = useTransition();
  const [state, formAction, actionPending] = useActionState(
    saveRuleQuestionAction,
    INITIAL_READINESS_ACTION_STATE,
  );
  const pending = isPending || actionPending;

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    if (state === handledStateRef.current) return;
    handledStateRef.current = state;

    if (state.status === "success" && state.answer) {
      setMessages((current) => {
        const last = current.at(-1);
        if (last?.role === "assistant" && last.content === state.answer) return current;
        return [
          ...current,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: state.answer!,
            sourceIds: state.sourceIds,
          },
        ];
      });
      setDraft("");
    }

    if (state.status === "error") {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content:
            state.message ?? "I couldn’t answer that right now. Please try again in a moment.",
        },
      ]);
    }
  }, [state]);

  useEffect(() => {
    if (!open) return;
    const node = listRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages, open, pending]);

  function submitQuestion(question: string) {
    const trimmed = question.trim();
    if (trimmed.length < 3 || pending || !formRef.current) return;

    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: "user", content: trimmed },
    ]);
    setDraft("");

    const formData = new FormData(formRef.current);
    formData.set("sessionId", sessionId);
    formData.set("question", trimmed);

    startTransition(() => {
      formAction(formData);
    });
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-end p-4 sm:p-6">
      <div className="pointer-events-auto flex flex-col items-end gap-3">
        {open ? (
          <section
            aria-label="RealDoor assistant chat"
            className="flex h-[min(34rem,calc(100dvh-6.5rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_18px_50px_rgba(15,23,42,0.18)]"
          >
            <header className="flex items-start justify-between gap-3 border-b border-border/70 bg-primary px-4 py-3 text-primary-foreground">
              <div className="min-w-0">
                <p className="text-sm font-bold">Ask RealDoor</p>
                <p className="mt-0.5 text-xs text-primary-foreground/85">
                  Frozen guide + your confirmed facts
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 text-primary-foreground/90 transition-colors hover:bg-primary-foreground/15"
                aria-label="Close chat"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </header>

            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-muted/20 px-3 py-3">
              {messages.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-background/80 p-3">
                  <p className="text-sm font-semibold text-foreground">
                    Hi — ask about this session
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Ask about annualization, income limits, or the checklist.
                  </p>
                  <div className="mt-3 flex flex-col gap-2">
                    {SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        disabled={pending}
                        onClick={() => submitQuestion(suggestion)}
                        className="rounded-lg border border-border bg-background px-3 py-2 text-left text-xs font-medium text-foreground transition-colors hover:bg-muted/50 disabled:opacity-60"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div className="max-w-[88%]">
                    <div
                      className={cn(
                        "rounded-2xl px-3 py-2 text-sm leading-6 shadow-sm",
                        message.role === "user"
                          ? "rounded-br-md bg-primary text-primary-foreground"
                          : "rounded-bl-md border border-border/80 bg-background text-foreground",
                      )}
                    >
                      {message.content}
                    </div>
                    {message.role === "assistant" && message.sourceIds?.length ? (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {message.sourceIds.map((sourceId) => {
                          const source = sources.find((item) => item.id === sourceId);
                          return source && ruleEffectiveDate ? (
                            <SourceCitationDialog
                              key={sourceId}
                              source={source}
                              version={ruleVersion}
                              effectiveDate={ruleEffectiveDate}
                            />
                          ) : null;
                        })}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}

              {pending ? (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md border border-border/80 bg-background px-3 py-2 text-xs text-muted-foreground">
                    Thinking…
                  </div>
                </div>
              ) : null}
            </div>

            <form
              ref={formRef}
              className="border-t border-border/70 bg-background p-3"
              onSubmit={(event) => {
                event.preventDefault();
                submitQuestion(draft);
              }}
            >
              <input type="hidden" name="sessionId" value={sessionId} />
              <div className="flex items-end gap-2">
                <label className="sr-only" htmlFor="readiness-chat-input">
                  Ask a question
                </label>
                <textarea
                  id="readiness-chat-input"
                  name="question"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  required
                  minLength={3}
                  maxLength={1000}
                  rows={2}
                  placeholder="Ask about rules, math, or the checklist…"
                  className="min-h-11 flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      submitQuestion(draft);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={pending || draft.trim().length < 3}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Send question"
                >
                  <SendIcon className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 text-2xs leading-4 text-muted-foreground">
                Not an eligibility decision. If the guide can’t support an answer, RealDoor will say
                so.
              </p>
            </form>
          </section>
        ) : null}

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className={cn(
            "inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_12px_30px_rgba(15,23,42,0.28)] transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            open && "bg-foreground",
          )}
          aria-expanded={open}
          aria-label={open ? "Close RealDoor assistant" : "Open RealDoor assistant"}
        >
          {open ? <XIcon className="h-6 w-6" /> : <MessageCircleIcon className="h-6 w-6" />}
        </button>
      </div>
    </div>
  );
}
