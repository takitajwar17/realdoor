"use server";

import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createServerAction, ZSAError } from "zsa";

import { SESSION_COOKIE_NAME } from "@/constants";
import { getDB } from "@/db";
import { userTable } from "@/db/schema";
import {
  deleteReadinessSessionRecord,
  getReadinessWorkspace,
  listReadinessSessions,
} from "@/features/readiness/server";
import { checkActionRateLimit } from "@/infra/action-rate-limit";
import { validateCsrfToken } from "@/infra/csrf";
import { deleteAllSessionsOfUser } from "@/infra/kv-session";
import { logger } from "@/infra/logger";
import { requireVerifiedEmail } from "@/utils/auth";

const deleteAccountSchema = z.object({
  confirmationText: z.literal("DELETE MY ACCOUNT"),
  csrfToken: z.string().optional(),
});

export const deleteAccountAction = createServerAction()
  .input(deleteAccountSchema)
  .handler(async ({ input }) => {
    if (!(await validateCsrfToken(input.csrfToken))) {
      throw new ZSAError("FORBIDDEN", "Invalid request");
    }

    const auth = await requireVerifiedEmail();
    if (!auth) throw new ZSAError("NOT_AUTHORIZED", "Not authenticated");
    await checkActionRateLimit("deleteAccount", auth.userId, 3);

    const readinessSessions = await listReadinessSessions(auth.userId);
    for (const session of readinessSessions) {
      await deleteReadinessSessionRecord(session.id, auth.userId);
    }

    await deleteAllSessionsOfUser(auth.userId);
    await getDB().delete(userTable).where(eq(userTable.id, auth.userId));

    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
    logger.info("User account and readiness sessions deleted", { userId: auth.userId });
    return { success: true };
  });

const exportUserDataSchema = z.object({
  csrfToken: z.string().optional(),
});

export const exportUserDataAction = createServerAction()
  .input(exportUserDataSchema)
  .handler(async ({ input }) => {
    if (!(await validateCsrfToken(input.csrfToken))) {
      throw new ZSAError("FORBIDDEN", "Invalid request");
    }

    const auth = await requireVerifiedEmail();
    if (!auth) throw new ZSAError("NOT_AUTHORIZED", "Not authenticated");
    await checkActionRateLimit("exportUserData", auth.userId, 5);

    const user = await getDB().query.userTable.findFirst({
      where: eq(userTable.id, auth.userId),
      columns: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        emailVerified: true,
        avatar: true,
        signUpIpAddress: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new ZSAError("NOT_FOUND", "User not found");

    const sessionRows = await listReadinessSessions(auth.userId);
    const workspaces = await Promise.all(
      sessionRows.map((session) => getReadinessWorkspace(session.id, auth.userId)),
    );

    const exportData = {
      exportedAt: new Date().toISOString(),
      dataSubject: user,
      readinessSessions: workspaces.map((workspace) => ({
        session: workspace.session,
        documents: workspace.documents.map((document) => ({
          id: document.id,
          mimeType: document.mimeType,
          sizeBytes: document.sizeBytes,
          sha256: document.sha256,
          kind: document.kind,
          extractionStatus: document.extractionStatus,
          included: document.included,
          metadata: document.payload,
          createdAt: document.createdAt,
          updatedAt: document.updatedAt,
        })),
        facts: workspace.facts.map((fact) => ({
          id: fact.id,
          documentId: fact.documentId,
          key: fact.key,
          status: fact.status,
          confidence: fact.confidence,
          content: fact.payload,
          createdAt: fact.createdAt,
          updatedAt: fact.updatedAt,
        })),
        questions: workspace.questions.map((question) => ({
          id: question.id,
          sourceIds: JSON.parse(question.sourceIds) as string[],
          content: question.payload,
          createdAt: question.createdAt,
        })),
        audit: workspace.audit,
      })),
      notice:
        "This JSON includes decrypted session metadata, facts, questions, and content-free audit events. Original document bytes are not duplicated in the export; each original remains available through its authenticated document link until the session or account is deleted.",
    };

    logger.info("User readiness data exported", { userId: auth.userId });
    return exportData;
  });
