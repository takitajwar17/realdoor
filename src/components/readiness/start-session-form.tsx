"use client";

import { useActionState } from "react";
import { ArrowRightIcon, LockKeyholeIcon } from "lucide-react";

import { createReadinessSessionAction } from "@/actions/readiness.action";
import { ActionMessage } from "@/components/readiness/action-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { INITIAL_READINESS_ACTION_STATE } from "@/features/readiness/action-state";

export function StartSessionForm() {
  const [state, action, pending] = useActionState(
    createReadinessSessionAction,
    INITIAL_READINESS_ACTION_STATE,
  );

  return (
    <Card className="overflow-hidden rounded-xl border-border/80 shadow-[var(--shadow-dashboard)]">
      <CardHeader className="border-b border-border/70 bg-muted/20">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <LockKeyholeIcon className="h-5 w-5" />
          </span>
          <div>
            <CardTitle className="text-base">Start a private practice session</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              You stay in control of every fact, document, and download.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        <form action={action} className="space-y-5">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/75 p-4 transition-colors hover:bg-muted/25">
            <Checkbox name="consent" className="mt-0.5" />
            <span>
              <span className="block text-sm font-semibold">I choose to create this session</span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                RealDoor may read the practice documents I upload and suggest profile fields. Nothing
                is sent to a property or anyone else.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
            <Checkbox name="useSyntheticRehearsal" className="mt-0.5" />
            <span>
              <span className="block text-sm font-semibold">Use practice values only</span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                This session uses clearly labeled practice numbers and documents—not official limits
                for a real application.
              </span>
            </span>
          </label>

          <ActionMessage state={state} />
          <div className="flex items-center justify-between gap-4 border-t border-border/70 pt-4">
            <p className="max-w-md text-xs text-muted-foreground">
              No eligibility decision, score, rank, or approval prediction is produced.
            </p>
            <Button type="submit" disabled={pending} className="shrink-0">
              {pending ? "Starting…" : "Start session"}
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
