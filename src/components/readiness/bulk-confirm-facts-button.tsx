"use client";

import { useActionState } from "react";
import { CheckCheckIcon } from "lucide-react";

import { confirmClearReadinessFactsAction } from "@/actions/readiness.action";
import { ActionMessage } from "@/components/readiness/action-message";
import { Button } from "@/components/ui/button";
import { INITIAL_READINESS_ACTION_STATE } from "@/features/readiness/action-state";

export function BulkConfirmFactsButton({ sessionId }: { sessionId: string }) {
  const [state, action, pending] = useActionState(
    confirmClearReadinessFactsAction,
    INITIAL_READINESS_ACTION_STATE,
  );

  return (
    <form action={action} className="flex flex-col items-end gap-2">
      <input type="hidden" name="sessionId" value={sessionId} />
      <Button type="submit" size="sm" disabled={pending}>
        <CheckCheckIcon className="h-4 w-4" />
        {pending ? "Confirming…" : "Confirm all"}
      </Button>
      <ActionMessage state={state} />
    </form>
  );
}
