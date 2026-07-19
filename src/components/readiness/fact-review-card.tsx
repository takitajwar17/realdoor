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
  const numericKeys = new Set([
    "household_size", "regular_hours", "weekly_hours", "hourly_rate", "gross_pay",
    "net_pay", "monthly_benefit", "gross_receipts", "platform_fees",
  ]);
  const moneyKeys = new Set([
    "hourly_rate", "gross_pay", "net_pay", "monthly_benefit", "gross_receipts", "platform_fees",
  ]);
  const isNumeric = numericKeys.has(item.key);
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
            <p className="text-2xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Field
            </p>
            <h3 className="mt-1 text-base font-bold">{getFactLabel(item.key)}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {item.conflict ? (
              <Badge
                variant="outline"
                className="border-destructive/25 bg-destructive/8 text-destructive"
              >
                Values don&apos;t match
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
              {item.status === "confirmed" ? "Confirmed by you" : confidenceLabel}
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`fact-${item.id}`}>Value to confirm</Label>
          <div className="relative">
            {moneyKeys.has(item.key) ? (
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
                moneyKeys.has(item.key)
                  ? "0.01"
                  : item.key === "household_size"
                    ? "1"
                    : undefined
              }
              className={moneyKeys.has(item.key) ? "pl-7" : undefined}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Correct the value if the document was read incorrectly. RealDoor uses it only after you
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
            <p className="text-2xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Source
            </p>
            <p className="mt-1 text-sm font-semibold">
              {item.documentName ?? "Entered by you"}
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
            <div className="mt-4 rounded-lg border border-border bg-background p-4">
              <div className="flex items-center gap-2 text-sm font-semibold"><FileSearchIcon className="h-4 w-4 text-primary" />Exact source location</div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {item.box
                  ? `Page ${item.page ?? 1}; box ${Math.round(item.box.x * 100)}% from the left, ${Math.round(item.box.y * 100)}% from the top, ${Math.round(item.box.width * 100)}% wide, and ${Math.round(item.box.height * 100)}% high.`
                  : "No document box is available. This value cannot be presented as document-located evidence."}
              </p>
            </div>
            <blockquote className="mt-3 border-l-2 border-primary pl-3 text-xs leading-5 text-foreground">
              “{item.sourceQuote}”
            </blockquote>
            <p className="mt-2 text-xs text-muted-foreground">
              {item.page ? `Page ${item.page}` : "From the document"}
              {item.status === "confirmed" ? " · Confirmed by you" : ""}
            </p>
          </>
        ) : (
          <p className="mt-4 rounded-lg border border-dashed border-border p-4 text-xs leading-5 text-muted-foreground">
            You entered this value yourself. It is labeled that way wherever it appears.
          </p>
        )}
      </div>
    </article>
  );
}
