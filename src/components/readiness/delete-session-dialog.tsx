"use client";

import { useActionState, useState } from "react";
import { Trash2Icon } from "lucide-react";

import { deleteReadinessSessionAction } from "@/actions/readiness.action";
import { ActionMessage } from "@/components/readiness/action-message";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { INITIAL_READINESS_ACTION_STATE } from "@/features/readiness/action-state";
import { Label } from "@/components/ui/label";

export function DeleteSessionDialog({ sessionId }: { sessionId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    deleteReadinessSessionAction,
    INITIAL_READINESS_ACTION_STATE,
  );

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          <Trash2Icon className="h-3.5 w-3.5" />
          Delete session
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this practice session?</AlertDialogTitle>
          <AlertDialogDescription>
            Vidicy will remove its linked facts, questions, activity history, and encrypted
            documents. A packet you already downloaded stays on your device. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form action={action} className="space-y-4">
          <input type="hidden" name="sessionId" value={sessionId} />
          <div className="space-y-2">
            <Label htmlFor="delete-session-confirmation">
              Type <span className="font-mono text-foreground">DELETE SESSION</span>
            </Label>
            <Input
              id="delete-session-confirmation"
              name="confirmation"
              autoComplete="off"
              required
            />
          </div>
          <ActionMessage state={state} />
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Keep session</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button type="submit" variant="destructive" disabled={pending}>
                {pending ? "Deleting…" : "Delete permanently"}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
