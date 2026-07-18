"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  CheckIcon,
  ExternalLinkIcon,
  FileSearchIcon,
  PencilLineIcon,
  Trash2Icon,
} from "lucide-react";

import { confirmReadinessFactAction, rejectReadinessFactAction } from "@/actions/readiness.action";
import { ActionMessage } from "@/components/readiness/action-message";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INITIAL_READINESS_ACTION_STATE } from "@/features/readiness/action-state";
import { getFactLabel } from "@/features/readiness/presentation";
import { cn } from "@/lib/utils";

export type FactReviewItem = {
  id: string;
  key: string;
  status: "extracted" | "confirmed" | "rejected";
  confidence: number | null;
  documentId: string | null;
  documentName: string | null;
  value: string;
  sourceQuote: string | null;
  page: number | null;
  box: { x: number; y: number; width: number; height: number } | null;
  conflict: boolean;
};

export function FactReviewCard({ item, sessionId }: { item: FactReviewItem; sessionId: string }) {
  const [state, action, pending] = useActionState(
    confirmReadinessFactAction,
    INITIAL_READINESS_ACTION_STATE,
  );
  const isNumeric = item.key.includes("income") || item.key === "household_size";
  const confidence = item.confidence === null ? null : Math.round(item.confidence * 100);
  const confidenceLabel =
    confidence === null ? "Entered by you" : confidence >= 90 ? "Clear reading" : "Review closely";

  return (
    <article className="grid overflow-hidden rounded-xl border border-border/80 bg-card shadow-[var(--shadow-dashboard)] lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.78fr)]">
      <form action={action} className="space-y-4 p-5">
        <input type="hidden" name="sessionId" value={sessionId} />
        <input type="hidden" name="factId" value={item.id} />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-2xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Profile field
            </p>
            <h3 className="mt-1 text-base font-bold">{getFactLabel(item.key)}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {item.conflict ? (
              <Badge
                variant="outline"
                className="border-destructive/25 bg-destructive/8 text-destructive"
              >
                Conflict · choose one
              </Badge>
            ) : null}
            <Badge
              variant="outline"
              className={cn(
                item.status === "confirmed"
                  ? "border-status-success/25 bg-status-success/8 text-status-success"
                  : "border-primary/20 bg-primary/7 text-primary",
              )}
            >
              {item.status === "confirmed" ? "Renter confirmed" : confidenceLabel}
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`fact-${item.id}`}>Value to confirm</Label>
          <div className="relative">
            {item.key.includes("income") ? (
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                $
              </span>
            ) : null}
            <Input
              id={`fact-${item.id}`}
              name="value"
              defaultValue={item.value}
              required
              type={isNumeric ? "number" : "text"}
              min={isNumeric ? 0 : undefined}
              step={
                item.key.includes("income")
                  ? "0.01"
                  : item.key === "household_size"
                    ? "1"
                    : undefined
              }
              className={item.key.includes("income") ? "pl-7" : undefined}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Correct the value if the document was read incorrectly. Vidicy uses it only after you
            confirm it.
          </p>
        </div>

        <ActionMessage state={state} />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={pending}>
            {item.status === "confirmed" ? (
              <PencilLineIcon className="h-4 w-4" />
            ) : (
              <CheckIcon className="h-4 w-4" />
            )}
            {pending
              ? "Saving…"
              : item.status === "confirmed"
                ? "Save correction"
                : "Confirm field"}
          </Button>
          <Button
            type="submit"
            formAction={rejectReadinessFactAction}
            variant="outline"
            className="text-destructive hover:text-destructive"
          >
            <Trash2Icon className="h-4 w-4" />
            Remove suggestion
          </Button>
        </div>
      </form>

      <div className="border-t border-border/70 bg-muted/18 p-5 lg:border-l lg:border-t-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-2xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Document evidence
            </p>
            <p className="mt-1 text-sm font-semibold">
              {item.documentName ?? "Manual renter entry"}
            </p>
          </div>
          {item.documentId ? (
            <Button asChild variant="ghost" size="sm">
              <Link
                href={`/api/readiness/documents/${item.documentId}?sessionId=${sessionId}`}
                target="_blank"
                rel="noreferrer"
                prefetch={false}
              >
                Open
                <ExternalLinkIcon className="h-3.5 w-3.5" />
              </Link>
            </Button>
          ) : null}
        </div>

        {item.sourceQuote ? (
          <>
            <div className="relative mt-4 aspect-[4/2.4] overflow-hidden rounded-lg border border-border bg-background shadow-inner">
              <div className="absolute inset-x-5 top-5 space-y-2" aria-hidden="true">
                <span className="block h-2 w-1/2 rounded bg-muted" />
                <span className="block h-2 w-5/6 rounded bg-muted" />
                <span className="block h-2 w-3/4 rounded bg-muted" />
                <span className="block h-2 w-2/3 rounded bg-muted" />
              </div>
              {item.box ? (
                <span
                  className="absolute rounded border-2 border-primary bg-primary/12 shadow-[0_0_0_2px_rgba(255,255,255,0.8)]"
                  style={{
                    left: `${item.box.x * 100}%`,
                    top: `${item.box.y * 100}%`,
                    width: `${item.box.width * 100}%`,
                    height: `${Math.max(item.box.height * 100, 8)}%`,
                  }}
                  aria-label="Source location highlighted in the uploaded document"
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <FileSearchIcon className="h-5 w-5" />
                </span>
              )}
            </div>
            <blockquote className="mt-3 border-l-2 border-primary pl-3 text-xs leading-5 text-foreground">
              “{item.sourceQuote}”
            </blockquote>
            <p className="mt-2 text-2xs font-medium text-muted-foreground">
              {item.page ? `Page ${item.page}` : "Page unavailable"}
              {confidence !== null ? ` · ${confidence}% reading confidence` : ""}
            </p>
          </>
        ) : (
          <p className="mt-4 rounded-lg border border-dashed border-border p-4 text-xs leading-5 text-muted-foreground">
            This fact was entered manually. It has no document evidence and is labeled that way
            everywhere it appears.
          </p>
        )}
      </div>
    </article>
  );
}
