"use client";

import { useActionState, useState } from "react";
import { SaveIcon } from "lucide-react";

import { saveManualFactAction } from "@/actions/readiness.action";
import { ActionMessage } from "@/components/readiness/action-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INITIAL_READINESS_ACTION_STATE } from "@/features/readiness/action-state";

const fields = [
  {
    key: "household_size",
    label: "Household size",
    help: "Count everyone who would be included in the household.",
    step: "1",
    min: 1,
    max: 8,
    prefix: null,
  },
  {
    key: "weekly_hours",
    label: "Weekly hours",
    help: "Enter the weekly hours shown by your source.",
    step: "0.01",
    min: 0,
    max: 10_000_000,
    prefix: null,
  },
  {
    key: "hourly_rate",
    label: "Hourly rate",
    help: "Enter the gross hourly rate shown by your source.",
    step: "0.01",
    min: 0,
    max: 10_000_000,
    prefix: "$",
  },
  {
    key: "monthly_benefit",
    label: "Monthly benefit",
    help: "Enter a recurring monthly benefit only when you have a source for it.",
    step: "0.01",
    min: 0,
    max: 10_000_000,
    prefix: "$",
  },
] as const;

type FieldKey = (typeof fields)[number]["key"];

export function ManualFactForm({
  sessionId,
  values,
}: {
  sessionId: string;
  values: Partial<Record<FieldKey, string>>;
}) {
  const [state, action, pending] = useActionState(
    saveManualFactAction,
    INITIAL_READINESS_ACTION_STATE,
  );
  const [selectedKey, setSelectedKey] = useState<FieldKey>("household_size");
  const field = fields.find(({ key }) => key === selectedKey) ?? fields[0];

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="sessionId" value={sessionId} />
      <div className="grid gap-4 md:grid-cols-[minmax(220px,0.8fr)_minmax(220px,1.2fr)] md:items-end">
        <div className="space-y-2">
          <Label htmlFor="manual-field">What would you like to add or correct?</Label>
          <select
            id="manual-field"
            name="key"
            value={selectedKey}
            onChange={(event) => setSelectedKey(event.target.value as FieldKey)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {fields.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`manual-value-${selectedKey}`}>{field.label}</Label>
          <div className="relative">
            {field.prefix ? (
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                {field.prefix}
              </span>
            ) : null}
            <Input
              key={selectedKey}
              id={`manual-value-${selectedKey}`}
              name="value"
              type="number"
              inputMode={selectedKey === "household_size" ? "numeric" : "decimal"}
              min={field.min}
              max={field.max}
              step={field.step}
              required
              defaultValue={values[selectedKey] ?? ""}
              className={field.prefix ? "pl-7" : undefined}
            />
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{field.help}</p>
      <ActionMessage state={state} />
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          <SaveIcon className="h-4 w-4" />
          {pending ? "Saving…" : "Save this value"}
        </Button>
      </div>
    </form>
  );
}
