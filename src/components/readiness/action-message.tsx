"use client";

import type { ReadinessActionState } from "@/features/readiness/action-state";
import { cn } from "@/lib/utils";

export function ActionMessage({ state }: { state: ReadinessActionState }) {
  if (state.status === "idle" || !state.message) return null;

  return (
    <p
      role={state.status === "error" ? "alert" : "status"}
      aria-live="polite"
      className={cn(
        "rounded-lg border px-3 py-2 text-xs font-medium",
        state.status === "error"
          ? "border-destructive/25 bg-destructive/8 text-destructive"
          : "border-status-success/25 bg-status-success/8 text-status-success",
      )}
    >
      {state.message}
    </p>
  );
}
