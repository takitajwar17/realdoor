"use client";

import { useActionState } from "react";
import { SaveIcon } from "lucide-react";

import {
  INITIAL_READINESS_ACTION_STATE,
  saveManualIncomeAction,
} from "@/actions/readiness.action";
import { ActionMessage } from "@/components/readiness/action-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ManualIncomeForm({
  sessionId,
  defaults,
}: {
  sessionId: string;
  defaults: {
    householdSize?: string;
    employmentMonthlyIncome?: string;
    benefitsMonthlyIncome?: string;
    otherMonthlyIncome?: string;
  };
}) {
  const [state, action, pending] = useActionState(
    saveManualIncomeAction,
    INITIAL_READINESS_ACTION_STATE,
  );

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="sessionId" value={sessionId} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="householdSize">Household size</Label>
          <Input
            id="householdSize"
            name="householdSize"
            type="number"
            inputMode="numeric"
            min={1}
            max={8}
            required
            defaultValue={defaults.householdSize}
          />
        </div>
        <MoneyField
          id="employmentMonthlyIncome"
          label="Employment / month"
          defaultValue={defaults.employmentMonthlyIncome}
        />
        <MoneyField
          id="benefitsMonthlyIncome"
          label="Benefits / month"
          defaultValue={defaults.benefitsMonthlyIncome}
        />
        <MoneyField
          id="otherMonthlyIncome"
          label="Other income / month"
          defaultValue={defaults.otherMonthlyIncome}
        />
      </div>
      <ActionMessage state={state} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Enter 0 to confirm that a listed source does not apply. Changes invalidate derived views immediately.
        </p>
        <Button type="submit" disabled={pending}>
          <SaveIcon className="h-4 w-4" />
          {pending ? "Saving…" : "Confirm these facts"}
        </Button>
      </div>
    </form>
  );
}

function MoneyField({
  id,
  label,
  defaultValue,
}: {
  id: string;
  label: string;
  defaultValue?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
          $
        </span>
        <Input
          id={id}
          name={id}
          type="number"
          inputMode="decimal"
          min={0}
          max={10_000_000}
          step="0.01"
          required
          defaultValue={defaultValue ?? "0"}
          className="pl-7"
        />
      </div>
    </div>
  );
}
