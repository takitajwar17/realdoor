export type ReadinessActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const INITIAL_READINESS_ACTION_STATE: ReadinessActionState = { status: "idle" };
