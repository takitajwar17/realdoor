"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  confirmFactSchema,
  createSessionSchema,
  deleteSessionSchema,
  manualIncomeSchema,
  rejectFactSchema,
  ruleQuestionSchema,
  updateDocumentSchema,
} from "@/features/readiness/contracts";
import {
  confirmReadinessFact,
  createReadinessSession,
  deleteReadinessSessionRecord,
  rejectReadinessFact,
  saveManualIncomeFacts,
  saveRuleQuestion,
  setDocumentIncluded,
} from "@/features/readiness/server";
import { checkActionRateLimit } from "@/infra/action-rate-limit";
import { logger } from "@/infra/logger";
import { requireVerifiedEmail } from "@/utils/auth";

export type ReadinessActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const INITIAL_READINESS_ACTION_STATE: ReadinessActionState = { status: "idle" };

function refreshSessionSurfaces(sessionId: string) {
  revalidatePath(`/dashboard/${sessionId}`);
  revalidatePath(`/dashboard/${sessionId}/profile`);
  revalidatePath(`/dashboard/${sessionId}/understand`);
  revalidatePath(`/dashboard/${sessionId}/prepare`);
  revalidatePath(`/dashboard/${sessionId}/evidence`);
}

function errorState(message: string): ReadinessActionState {
  return { status: "error", message };
}

async function requireReadinessActionAuth() {
  const auth = await requireVerifiedEmail();
  if (!auth) throw new Error("Not authenticated");
  return auth;
}

export async function createReadinessSessionAction(
  _previousState: ReadinessActionState,
  formData: FormData,
): Promise<ReadinessActionState> {
  const parsed = createSessionSchema.safeParse({
    consent: formData.get("consent") === "on",
    useSyntheticRehearsal: formData.get("useSyntheticRehearsal") === "on",
  });
  if (!parsed.success) {
    return errorState("Confirm both acknowledgements to start a synthetic rehearsal session.");
  }

  const auth = await requireReadinessActionAuth();
  await checkActionRateLimit("createReadinessSession", auth.userId, 10);
  const readinessSession = await createReadinessSession(auth.userId);
  redirect(`/dashboard/${readinessSession.id}/profile`);
}

export async function saveManualIncomeAction(
  _previousState: ReadinessActionState,
  formData: FormData,
): Promise<ReadinessActionState> {
  const parsed = manualIncomeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return errorState("Enter a household size from 1–8 and non-negative monthly amounts.");
  }

  try {
    const auth = await requireReadinessActionAuth();
    await checkActionRateLimit("saveManualReadinessFacts", auth.userId, 60);
    await saveManualIncomeFacts({ ...parsed.data, userId: auth.userId });
    refreshSessionSurfaces(parsed.data.sessionId);
    return { status: "success", message: "Confirmed facts saved. Derived surfaces were refreshed." };
  } catch (error) {
    logger.warn("Manual readiness fact update failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return errorState("We could not save those facts. Refresh and try again.");
  }
}

export async function confirmReadinessFactAction(
  _previousState: ReadinessActionState,
  formData: FormData,
): Promise<ReadinessActionState> {
  const parsed = confirmFactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return errorState("Enter a value before confirming this field.");

  try {
    const auth = await requireReadinessActionAuth();
    await checkActionRateLimit("confirmReadinessFact", auth.userId, 120);
    await confirmReadinessFact({ ...parsed.data, userId: auth.userId });
    refreshSessionSurfaces(parsed.data.sessionId);
    return { status: "success", message: "Field confirmed and downstream views refreshed." };
  } catch (error) {
    logger.warn("Readiness fact confirmation failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return errorState("We could not confirm that field. Refresh and try again.");
  }
}

export async function rejectReadinessFactAction(formData: FormData) {
  const parsed = rejectFactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const auth = await requireReadinessActionAuth();
  await checkActionRateLimit("rejectReadinessFact", auth.userId, 120);
  await rejectReadinessFact({ ...parsed.data, userId: auth.userId });
  refreshSessionSurfaces(parsed.data.sessionId);
}

export async function saveRuleQuestionAction(
  _previousState: ReadinessActionState,
  formData: FormData,
): Promise<ReadinessActionState> {
  const parsed = ruleQuestionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return errorState("Ask a question between 3 and 1,000 characters.");

  try {
    const auth = await requireReadinessActionAuth();
    await checkActionRateLimit("readinessRuleQuestion", auth.userId, 40);
    const answer = await saveRuleQuestion({ ...parsed.data, userId: auth.userId });
    refreshSessionSurfaces(parsed.data.sessionId);
    return {
      status: "success",
      message: answer.status === "answered" ? "Answered from the frozen corpus." : "The corpus abstained.",
    };
  } catch (error) {
    logger.warn("Readiness rule question failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return errorState("The question could not be saved. Try again.");
  }
}

export async function updateDocumentIncludedAction(formData: FormData) {
  const parsed = updateDocumentSchema.safeParse({
    ...Object.fromEntries(formData),
    included: formData.get("included") === "true",
  });
  if (!parsed.success) return;

  const auth = await requireReadinessActionAuth();
  await checkActionRateLimit("updateReadinessPacket", auth.userId, 120);
  await setDocumentIncluded({ ...parsed.data, userId: auth.userId });
  refreshSessionSurfaces(parsed.data.sessionId);
}

export async function deleteReadinessSessionAction(
  _previousState: ReadinessActionState,
  formData: FormData,
): Promise<ReadinessActionState> {
  const parsed = deleteSessionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return errorState('Type "DELETE SESSION" to confirm.');

  try {
    const auth = await requireReadinessActionAuth();
    await checkActionRateLimit("deleteReadinessSession", auth.userId, 10);
    await deleteReadinessSessionRecord(parsed.data.sessionId, auth.userId);
  } catch (error) {
    logger.error("Readiness session deletion failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return errorState("The session was not deleted because every linked record could not be removed.");
  }

  revalidatePath("/dashboard");
  redirect("/dashboard?deleted=1");
}
