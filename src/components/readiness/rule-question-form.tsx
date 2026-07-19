"use client";

import { useActionState } from "react";
import { SendIcon } from "lucide-react";

import { saveRuleQuestionAction } from "@/actions/readiness.action";
import { INITIAL_READINESS_ACTION_STATE } from "@/features/readiness/action-state";
import { ActionMessage } from "@/components/readiness/action-message";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function RuleQuestionForm({ sessionId }: { sessionId: string }) {
  const [state, action, pending] = useActionState(
    saveRuleQuestionAction,
    INITIAL_READINESS_ACTION_STATE,
  );

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="sessionId" value={sessionId} />
      <Label htmlFor="rule-question">Your question</Label>
      <Textarea
        id="rule-question"
        name="question"
        required
        minLength={3}
        maxLength={1000}
        placeholder="For example: How is monthly income annualized?"
        className="min-h-24 resize-y"
      />
      <ActionMessage state={state} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          If the practice guide cannot answer safely, RealDoor will say so instead of guessing.
        </p>
        <Button type="submit" disabled={pending}>
          <SendIcon className="h-4 w-4" />
          {pending ? "Looking up…" : "Ask"}
        </Button>
      </div>
    </form>
  );
}
