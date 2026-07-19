"use client";

import { useActionState, useState } from "react";
import { ArrowRightIcon, LockKeyholeIcon, PlusIcon } from "lucide-react";

import { createReadinessSessionAction } from "@/actions/readiness.action";
import { ActionMessage } from "@/components/readiness/action-message";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { INITIAL_READINESS_ACTION_STATE } from "@/features/readiness/action-state";
import { DEFAULT_READINESS_SESSION_NAME } from "@/features/readiness/presentation";

export function StartSessionDialog({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [state, action, pending] = useActionState(
    createReadinessSessionAction,
    INITIAL_READINESS_ACTION_STATE,
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="h-4 w-4" />
          New practice session
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[min(90vh,720px)] gap-0 overflow-y-auto p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-border/70 bg-muted/20 px-6 py-5 pr-14 text-left">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <LockKeyholeIcon className="h-5 w-5" />
            </span>
            <div>
              <DialogTitle className="text-base">Start a private practice session</DialogTitle>
              <DialogDescription className="mt-1 leading-6">
                You stay in control of every fact, document, and download.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form action={action} className="space-y-5 p-6">
          <div className="space-y-2">
            <Label htmlFor="session-name">Session name</Label>
            <Input
              id="session-name"
              name="name"
              defaultValue={DEFAULT_READINESS_SESSION_NAME}
              maxLength={80}
              required
              autoComplete="off"
              aria-describedby="session-name-description"
            />
            <p id="session-name-description" className="text-xs leading-5 text-muted-foreground">
              Choose a name that will help you recognize this session later.
            </p>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/75 p-4 transition-colors hover:bg-muted/25">
            <Checkbox name="consent" className="mt-0.5" />
            <span>
              <span className="block text-sm font-semibold">I choose to create this session</span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                RealDoor may read the practice documents I upload and suggest profile fields.
                Nothing is sent to a property or anyone else.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
            <Checkbox name="acknowledgeSampleData" className="mt-0.5" />
            <span>
              <span className="block text-sm font-semibold">Use authorized sample documents</span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                The supplied household documents are synthetic. The cited FY 2026 HUD thresholds are
                frozen official source values, but RealDoor does not make an eligibility decision.
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
      </DialogContent>
    </Dialog>
  );
}
