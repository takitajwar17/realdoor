export type ReadinessActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  /** Populated by the rules chat action so the floating assistant can render replies. */
  answer?: string;
  sourceIds?: string[];
};

export const INITIAL_READINESS_ACTION_STATE: ReadinessActionState = { status: "idle" };
