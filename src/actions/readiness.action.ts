"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  confirmFactSchema,
  confirmClearFactsSchema,
  createSessionSchema,
  deleteSessionSchema,
  documentMetadataSchema,
  manualFactSchema,
  rejectFactSchema,
  removeDocumentSchema,
  ruleQuestionSchema,
  updateDocumentSchema,
} from "@/features/readiness/contracts";
import {
  confirmReadinessFact,
  confirmClearReadinessFacts,
  confirmReadinessDocumentMetadata,
  createReadinessSession,
  deleteReadinessDocumentRecord,
  deleteReadinessSessionRecord,
  rejectReadinessFact,
  saveManualFact,
  saveRuleQuestion,
  setDocumentIncluded,
} from "@/features/readiness/server";
import type { ReadinessActionState } from "@/features/readiness/action-state";
import { checkActionRateLimit } from "@/infra/action-rate-limit";
import { logger } from "@/infra/logger";
import { requireVerifiedEmail } from "@/utils/auth";

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
    name: formData.get("name"),
    consent: formData.get("consent") === "on",
    acknowledgeSampleData: formData.get("acknowledgeSampleData") === "on",
  });
  if (!parsed.success) {
    const nameError = parsed.error.issues.some((issue) => issue.path[0] === "name");
    return errorState(
      nameError
        ? "Enter a session name using 80 characters or fewer."
        : "Confirm both acknowledgements to start your practice session.",
    );
  }

  const auth = await requireReadinessActionAuth();
  await checkActionRateLimit("createReadinessSession", auth.userId, 10);
  const readinessSession = await createReadinessSession(auth.userId, parsed.data.name);
  redirect(`/dashboard/${readinessSession.id}/profile`);
}

export async function saveManualFactAction(
  _previousState: ReadinessActionState,
  formData: FormData,
): Promise<ReadinessActionState> {
  const parsed = manualFactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return errorState("Enter a valid value. Household size must be a whole number from 1–8.");
  }

  try {
    const auth = await requireReadinessActionAuth();
    await checkActionRateLimit("saveManualReadinessFacts", auth.userId, 60);
    await saveManualFact({ ...parsed.data, userId: auth.userId });
    refreshSessionSurfaces(parsed.data.sessionId);
    return { status: "success", message: "Saved. Your comparison and packet are up to date." };
  } catch (error) {
    logger.warn("Manual readiness fact update failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return errorState("We could not save that value. Refresh and try again.");
  }
}

export async function confirmDocumentDetailsAction(
  _previousState: ReadinessActionState,
  formData: FormData,
): Promise<ReadinessActionState> {
  const parsed = documentMetadataSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return errorState("Choose a document type and enter a valid date, or leave the date blank.");
  }

  try {
    const auth = await requireReadinessActionAuth();
    await checkActionRateLimit("confirmReadinessDocumentDetails", auth.userId, 120);
    await confirmReadinessDocumentMetadata({ ...parsed.data, userId: auth.userId });
    refreshSessionSurfaces(parsed.data.sessionId);
    return { status: "success", message: "Document details confirmed." };
  } catch (error) {
    logger.warn("Readiness document detail confirmation failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return errorState("We could not save these document details. Refresh and try again.");
  }
}

export async function removeReadinessDocumentAction(
  _previousState: ReadinessActionState,
  formData: FormData,
): Promise<ReadinessActionState> {
  const parsed = removeDocumentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return errorState("This document could not be identified.");

  try {
    const auth = await requireReadinessActionAuth();
    await checkActionRateLimit("removeReadinessDocument", auth.userId, 60);
    await deleteReadinessDocumentRecord({ ...parsed.data, userId: auth.userId });
    refreshSessionSurfaces(parsed.data.sessionId);
    return { status: "success", message: "Document and its suggested fields were removed." };
  } catch (error) {
    logger.error("Readiness document removal failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return errorState(
      "The document was not removed because all linked copies could not be deleted.",
    );
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
    return {
      status: "success",
      message: "Field confirmed. Your comparison and packet are up to date.",
    };
  } catch (error) {
    logger.warn("Readiness fact confirmation failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return errorState("We could not confirm that field. Refresh and try again.");
  }
}

export async function confirmClearReadinessFactsAction(
  _previousState: ReadinessActionState,
  formData: FormData,
): Promise<ReadinessActionState> {
  const parsed = confirmClearFactsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return errorState("This session could not be identified.");

  try {
    const auth = await requireReadinessActionAuth();
    await checkActionRateLimit("confirmClearReadinessFacts", auth.userId, 20);
    const confirmedCount = await confirmClearReadinessFacts({
      ...parsed.data,
      userId: auth.userId,
    });
    refreshSessionSurfaces(parsed.data.sessionId);
    return {
      status: "success",
      message:
        confirmedCount === 0
          ? "There are no clear readings left to confirm."
          : `${confirmedCount} field${confirmedCount === 1 ? "" : "s"} confirmed.`,
    };
  } catch (error) {
    logger.warn("Bulk readiness fact confirmation failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return errorState("We could not confirm those readings. Refresh and try again.");
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
    return {
      status: "success",
      message:
        answer.status === "answered"
          ? "Answered from the frozen guide passages for this session."
          : "The frozen guide does not support a safe answer to that question.",
      answer: answer.answer,
      sourceIds: answer.sourceIds,
    };
  } catch (error) {
    logger.warn("Readiness rule question failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return errorState("The question could not be answered right now. Try again in a moment.");
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
    return errorState(
      "The session was not deleted because every linked record could not be removed.",
    );
  }

  revalidatePath("/dashboard");
  redirect("/dashboard?deleted=1");
}
