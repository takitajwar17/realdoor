import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { and, asc, desc, eq, ne } from "drizzle-orm";

import { getDB } from "@/db";
import {
  DOCUMENT_KIND,
  EXTRACTION_STATUS,
  FACT_STATUS,
  READINESS_STAGE,
  readinessAuditTable,
  readinessDocumentTable,
  readinessFactTable,
  readinessQuestionTable,
  readinessSessionTable,
  type ReadinessDocumentRecord,
  type ReadinessFactRecord,
  type ReadinessSession,
} from "@/db/schema";

import { openEncryptedJson, sealJson } from "./crypto";
import {
  calculateIncomeComparison,
  deriveChecklist,
  detectFactConflicts,
  type ConfirmedFact,
  type EvidenceBox,
  type ExtractedFact,
  type FactKey,
  type ReadinessDocument,
} from "./domain";
import { SYNTHETIC_2026_RULE_PACK, answerRuleQuestion } from "./rules";

const LOCAL_DEVELOPMENT_ENCRYPTION_KEY =
  "vidicy-readiness-local-development-key-do-not-use-in-production";

type DocumentPayload = {
  name: string;
  issuedOn: string | null;
  pageCount: number | null;
  extractionError: string | null;
};

export type FactPayload = {
  value: string;
  sourceQuote: string | null;
  page: number | null;
  box: EvidenceBox | null;
  origin: "extracted" | "manual";
};

type QuestionPayload = {
  question: string;
  answer: string;
};

function resolveWorkerSecret() {
  try {
    const { env } = getCloudflareContext();
    return (env as unknown as Record<string, string | undefined>).READINESS_ENCRYPTION_KEY;
  } catch {
    return undefined;
  }
}

export function getReadinessEncryptionSecret() {
  const configured = resolveWorkerSecret() ?? process.env.READINESS_ENCRYPTION_KEY;
  if (configured) return configured;

  if (process.env.NODE_ENV !== "production") {
    return LOCAL_DEVELOPMENT_ENCRYPTION_KEY;
  }

  throw new Error("READINESS_ENCRYPTION_KEY is required in production");
}

const documentContext = (sessionId: string, documentId: string) =>
  `${sessionId}:${documentId}:metadata`;
const factContext = (sessionId: string, factId: string) => `${sessionId}:${factId}:fact`;
const questionContext = (sessionId: string, questionId: string) =>
  `${sessionId}:${questionId}:question`;

export const documentContentContext = (sessionId: string, documentId: string) =>
  `${sessionId}:${documentId}:document`;

async function assertOwnedSession(sessionId: string, userId: string): Promise<ReadinessSession> {
  const db = getDB();
  const session = await db.query.readinessSessionTable.findFirst({
    where: and(eq(readinessSessionTable.id, sessionId), eq(readinessSessionTable.userId, userId)),
  });

  if (!session) {
    throw new Error("Readiness session not found");
  }

  return session;
}

async function appendAudit(input: {
  sessionId: string;
  action: string;
  subjectType: string;
  subjectId?: string | null;
}) {
  const db = getDB();
  await db.insert(readinessAuditTable).values({
    sessionId: input.sessionId,
    action: input.action,
    subjectType: input.subjectType,
    subjectId: input.subjectId ?? null,
  });
}

async function bumpRevision(sessionId: string) {
  const db = getDB();
  const session = await db.query.readinessSessionTable.findFirst({
    where: eq(readinessSessionTable.id, sessionId),
    columns: { revision: true },
  });
  if (!session) throw new Error("Readiness session not found");

  await db
    .update(readinessSessionTable)
    .set({ revision: session.revision + 1, lastAccessedAt: new Date() })
    .where(eq(readinessSessionTable.id, sessionId));
}

export async function listReadinessSessions(userId: string) {
  return getDB()
    .select()
    .from(readinessSessionTable)
    .where(eq(readinessSessionTable.userId, userId))
    .orderBy(desc(readinessSessionTable.lastAccessedAt));
}

export async function createReadinessSession(userId: string, now = new Date()) {
  const db = getDB();
  const [session] = await db
    .insert(readinessSessionTable)
    .values({
      userId,
      consentVersion: "2026-07-19-v1",
      consentedAt: now,
      stage: READINESS_STAGE.PROFILE,
      targetYear: 2026,
      metro: SYNTHETIC_2026_RULE_PACK.metro,
      program: SYNTHETIC_2026_RULE_PACK.program,
      rulePackId: SYNTHETIC_2026_RULE_PACK.id,
      ruleAuthority: SYNTHETIC_2026_RULE_PACK.authority,
      asOfDate: now.toISOString().slice(0, 10),
      lastAccessedAt: now,
    })
    .returning();

  if (!session) throw new Error("Could not create readiness session");

  await appendAudit({
    sessionId: session.id,
    action: "session_started",
    subjectType: "session",
    subjectId: session.id,
  });
  return session;
}

export async function getReadinessSession(sessionId: string, userId: string) {
  const session = await assertOwnedSession(sessionId, userId);
  await getDB()
    .update(readinessSessionTable)
    .set({ lastAccessedAt: new Date() })
    .where(eq(readinessSessionTable.id, sessionId));
  return session;
}

export async function setReadinessStage(
  sessionId: string,
  userId: string,
  stage: (typeof READINESS_STAGE)[keyof typeof READINESS_STAGE],
) {
  await assertOwnedSession(sessionId, userId);
  await getDB()
    .update(readinessSessionTable)
    .set({ stage, lastAccessedAt: new Date() })
    .where(eq(readinessSessionTable.id, sessionId));
}

async function decryptDocument(record: ReadinessDocumentRecord) {
  const payload = await openEncryptedJson<DocumentPayload>(record.encryptedPayload, {
    secret: getReadinessEncryptionSecret(),
    context: documentContext(record.sessionId, record.id),
  });

  return { ...record, payload };
}

async function decryptFact(record: ReadinessFactRecord) {
  const payload = await openEncryptedJson<FactPayload>(record.encryptedPayload, {
    secret: getReadinessEncryptionSecret(),
    context: factContext(record.sessionId, record.id),
  });

  return { ...record, payload };
}

export async function getReadinessWorkspace(sessionId: string, userId: string) {
  const session = await assertOwnedSession(sessionId, userId);
  const db = getDB();
  const [documentRows, factRows, questionRows, audit] = await Promise.all([
    db
      .select()
      .from(readinessDocumentTable)
      .where(eq(readinessDocumentTable.sessionId, sessionId))
      .orderBy(desc(readinessDocumentTable.createdAt)),
    db
      .select()
      .from(readinessFactTable)
      .where(eq(readinessFactTable.sessionId, sessionId))
      .orderBy(asc(readinessFactTable.createdAt)),
    db
      .select()
      .from(readinessQuestionTable)
      .where(eq(readinessQuestionTable.sessionId, sessionId))
      .orderBy(desc(readinessQuestionTable.createdAt)),
    db
      .select()
      .from(readinessAuditTable)
      .where(eq(readinessAuditTable.sessionId, sessionId))
      .orderBy(desc(readinessAuditTable.createdAt)),
  ]);

  const [documents, facts, questions] = await Promise.all([
    Promise.all(documentRows.map(decryptDocument)),
    Promise.all(factRows.map(decryptFact)),
    Promise.all(
      questionRows.map(async (record) => ({
        ...record,
        payload: await openEncryptedJson<QuestionPayload>(record.encryptedPayload, {
          secret: getReadinessEncryptionSecret(),
          context: questionContext(record.sessionId, record.id),
        }),
      })),
    ),
  ]);

  const confirmedFacts: ConfirmedFact[] = facts
    .filter((fact) => fact.status === FACT_STATUS.CONFIRMED)
    .map((fact) => ({
      key: fact.key as FactKey,
      value: fact.payload.value,
      status: "confirmed",
      updatedAt: fact.updatedAt.toISOString(),
    }));

  const extractedFacts: ExtractedFact[] = facts
    .filter((fact) => fact.status === FACT_STATUS.EXTRACTED)
    .map((fact) => ({
      key: fact.key as FactKey,
      value: fact.payload.value,
      confidence: (fact.confidence ?? 0) / 1000,
      sourceQuote: fact.payload.sourceQuote ?? "Source excerpt unavailable",
      ...(fact.payload.page ? { page: fact.payload.page } : {}),
      ...(fact.payload.box ? { box: fact.payload.box } : {}),
      status: "extracted",
    }));

  const readinessDocuments: ReadinessDocument[] = documents.map((document) => ({
    id: document.id,
    kind: document.kind,
    name: document.payload.name,
    issuedOn: document.payload.issuedOn,
    included: document.included,
  }));

  return {
    session,
    documents,
    facts,
    questions,
    audit,
    confirmedFacts,
    conflicts: detectFactConflicts(extractedFacts),
    comparison: calculateIncomeComparison({
      facts: confirmedFacts,
      rulePack: SYNTHETIC_2026_RULE_PACK,
    }),
    checklist: deriveChecklist({
      asOf: session.asOfDate,
      documents: readinessDocuments,
      rules: SYNTHETIC_2026_RULE_PACK,
    }),
    rulePack: SYNTHETIC_2026_RULE_PACK,
  };
}

export async function saveManualIncomeFacts(input: {
  sessionId: string;
  userId: string;
  householdSize: number;
  employmentMonthlyIncome: number;
  benefitsMonthlyIncome: number;
  otherMonthlyIncome: number;
}) {
  await assertOwnedSession(input.sessionId, input.userId);
  const db = getDB();
  const entries: Array<[FactKey, number]> = [
    ["household_size", input.householdSize],
    ["employment_monthly_income", input.employmentMonthlyIncome],
    ["benefits_monthly_income", input.benefitsMonthlyIncome],
    ["other_monthly_income", input.otherMonthlyIncome],
  ];

  for (const [key, numericValue] of entries) {
    await db
      .update(readinessFactTable)
      .set({ status: FACT_STATUS.REJECTED, rejectedAt: new Date() })
      .where(
        and(
          eq(readinessFactTable.sessionId, input.sessionId),
          eq(readinessFactTable.key, key),
          eq(readinessFactTable.status, FACT_STATUS.CONFIRMED),
        ),
      );

    const factId = `rdf_${crypto.randomUUID().replaceAll("-", "")}`;
    const encryptedPayload = await sealJson(
      {
        value: String(numericValue),
        sourceQuote: null,
        page: null,
        box: null,
        origin: "manual",
      } satisfies FactPayload,
      {
        secret: getReadinessEncryptionSecret(),
        context: factContext(input.sessionId, factId),
      },
    );

    await db.insert(readinessFactTable).values({
      id: factId,
      sessionId: input.sessionId,
      key,
      status: FACT_STATUS.CONFIRMED,
      confidence: null,
      encryptedPayload,
      confirmedAt: new Date(),
    });
  }

  await bumpRevision(input.sessionId);
  await appendAudit({
    sessionId: input.sessionId,
    action: "manual_facts_confirmed",
    subjectType: "fact_set",
  });
}

export async function confirmReadinessFact(input: {
  sessionId: string;
  factId: string;
  userId: string;
  value: string;
}) {
  await assertOwnedSession(input.sessionId, input.userId);
  const db = getDB();
  const fact = await db.query.readinessFactTable.findFirst({
    where: and(
      eq(readinessFactTable.id, input.factId),
      eq(readinessFactTable.sessionId, input.sessionId),
    ),
  });
  if (!fact) throw new Error("Fact not found");

  const existing = await decryptFact(fact);
  const encryptedPayload = await sealJson(
    { ...existing.payload, value: input.value },
    {
      secret: getReadinessEncryptionSecret(),
      context: factContext(input.sessionId, input.factId),
    },
  );

  await db
    .update(readinessFactTable)
    .set({ status: FACT_STATUS.REJECTED, rejectedAt: new Date() })
    .where(
      and(
        eq(readinessFactTable.sessionId, input.sessionId),
        eq(readinessFactTable.key, fact.key),
        eq(readinessFactTable.status, FACT_STATUS.CONFIRMED),
        ne(readinessFactTable.id, input.factId),
      ),
    );

  await db
    .update(readinessFactTable)
    .set({
      status: FACT_STATUS.CONFIRMED,
      confirmedAt: new Date(),
      rejectedAt: null,
      encryptedPayload,
    })
    .where(
      and(
        eq(readinessFactTable.id, input.factId),
        eq(readinessFactTable.sessionId, input.sessionId),
      ),
    );

  await bumpRevision(input.sessionId);
  await appendAudit({
    sessionId: input.sessionId,
    action: "fact_confirmed",
    subjectType: "fact",
    subjectId: input.factId,
  });
}

export async function rejectReadinessFact(input: {
  sessionId: string;
  factId: string;
  userId: string;
}) {
  await assertOwnedSession(input.sessionId, input.userId);
  const db = getDB();
  const [updated] = await db
    .update(readinessFactTable)
    .set({ status: FACT_STATUS.REJECTED, rejectedAt: new Date() })
    .where(
      and(
        eq(readinessFactTable.id, input.factId),
        eq(readinessFactTable.sessionId, input.sessionId),
      ),
    )
    .returning({ id: readinessFactTable.id });

  if (!updated) throw new Error("Fact not found");
  await bumpRevision(input.sessionId);
  await appendAudit({
    sessionId: input.sessionId,
    action: "fact_removed",
    subjectType: "fact",
    subjectId: input.factId,
  });
}

export async function saveRuleQuestion(input: {
  sessionId: string;
  userId: string;
  question: string;
}) {
  await assertOwnedSession(input.sessionId, input.userId);
  const answer = answerRuleQuestion(input.question);
  const id = `rdq_${crypto.randomUUID().replaceAll("-", "")}`;
  const encryptedPayload = await sealJson(
    { question: input.question, answer: answer.answer } satisfies QuestionPayload,
    {
      secret: getReadinessEncryptionSecret(),
      context: questionContext(input.sessionId, id),
    },
  );

  await getDB().insert(readinessQuestionTable).values({
    id,
    sessionId: input.sessionId,
    sourceIds: JSON.stringify(answer.sourceIds),
    encryptedPayload,
  });
  await appendAudit({
    sessionId: input.sessionId,
    action: answer.status === "answered" ? "rule_question_answered" : "rule_question_unresolved",
    subjectType: "question",
    subjectId: id,
  });
  return answer;
}

export async function setDocumentIncluded(input: {
  sessionId: string;
  documentId: string;
  userId: string;
  included: boolean;
}) {
  await assertOwnedSession(input.sessionId, input.userId);
  const [updated] = await getDB()
    .update(readinessDocumentTable)
    .set({ included: input.included })
    .where(
      and(
        eq(readinessDocumentTable.id, input.documentId),
        eq(readinessDocumentTable.sessionId, input.sessionId),
      ),
    )
    .returning({ id: readinessDocumentTable.id });

  if (!updated) throw new Error("Document not found");
  await appendAudit({
    sessionId: input.sessionId,
    action: input.included ? "document_included" : "document_excluded",
    subjectType: "document",
    subjectId: input.documentId,
  });
}

export async function getOwnedDocument(input: {
  sessionId: string;
  documentId: string;
  userId: string;
}) {
  await assertOwnedSession(input.sessionId, input.userId);
  const document = await getDB().query.readinessDocumentTable.findFirst({
    where: and(
      eq(readinessDocumentTable.id, input.documentId),
      eq(readinessDocumentTable.sessionId, input.sessionId),
    ),
  });
  if (!document) throw new Error("Document not found");
  return decryptDocument(document);
}

export async function insertReadinessDocument(input: {
  id: string;
  sessionId: string;
  userId: string;
  r2Key: string;
  mimeType: "application/pdf" | "image/jpeg" | "image/png";
  sizeBytes: number;
  sha256: string;
  name: string;
  pageCount: number | null;
}) {
  await assertOwnedSession(input.sessionId, input.userId);
  const encryptedPayload = await sealJson(
    {
      name: input.name,
      issuedOn: null,
      pageCount: input.pageCount,
      extractionError: null,
    } satisfies DocumentPayload,
    {
      secret: getReadinessEncryptionSecret(),
      context: documentContext(input.sessionId, input.id),
    },
  );

  const [document] = await getDB()
    .insert(readinessDocumentTable)
    .values({
      id: input.id,
      sessionId: input.sessionId,
      r2Key: input.r2Key,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      sha256: input.sha256,
      kind: DOCUMENT_KIND.OTHER,
      extractionStatus: EXTRACTION_STATUS.UPLOADED,
      encryptedPayload,
    })
    .returning();

  if (!document) throw new Error("Could not save document");
  await bumpRevision(input.sessionId);
  await appendAudit({
    sessionId: input.sessionId,
    action: "document_uploaded",
    subjectType: "document",
    subjectId: input.id,
  });
  return document;
}

export async function updateDocumentExtraction(input: {
  sessionId: string;
  documentId: string;
  userId: string;
  kind: (typeof DOCUMENT_KIND)[keyof typeof DOCUMENT_KIND];
  issuedOn: string | null;
  pageCount: number | null;
  facts: Array<{
    key: FactKey;
    value: string;
    confidence: number;
    sourceQuote: string;
    page: number | null;
    box: EvidenceBox | null;
  }>;
}) {
  const document = await getOwnedDocument(input);
  const db = getDB();
  const encryptedDocumentPayload = await sealJson(
    {
      ...document.payload,
      issuedOn: input.issuedOn,
      pageCount: input.pageCount,
      extractionError: null,
    } satisfies DocumentPayload,
    {
      secret: getReadinessEncryptionSecret(),
      context: documentContext(input.sessionId, input.documentId),
    },
  );

  await db
    .update(readinessDocumentTable)
    .set({
      kind: input.kind,
      extractionStatus: EXTRACTION_STATUS.READY,
      encryptedPayload: encryptedDocumentPayload,
      processedAt: new Date(),
    })
    .where(
      and(
        eq(readinessDocumentTable.id, input.documentId),
        eq(readinessDocumentTable.sessionId, input.sessionId),
      ),
    );

  for (const fact of input.facts) {
    const id = `rdf_${crypto.randomUUID().replaceAll("-", "")}`;
    const encryptedPayload = await sealJson(
      {
        value: fact.value,
        sourceQuote: fact.sourceQuote,
        page: fact.page,
        box: fact.box,
        origin: "extracted",
      } satisfies FactPayload,
      {
        secret: getReadinessEncryptionSecret(),
        context: factContext(input.sessionId, id),
      },
    );

    await db.insert(readinessFactTable).values({
      id,
      sessionId: input.sessionId,
      documentId: input.documentId,
      key: fact.key,
      status: FACT_STATUS.EXTRACTED,
      confidence: Math.round(Math.min(1, Math.max(0, fact.confidence)) * 1000),
      encryptedPayload,
    });
  }

  await bumpRevision(input.sessionId);
  await appendAudit({
    sessionId: input.sessionId,
    action: "document_extracted",
    subjectType: "document",
    subjectId: input.documentId,
  });
}

export async function markDocumentExtractionProcessing(input: {
  sessionId: string;
  documentId: string;
  userId: string;
}) {
  await getOwnedDocument(input);
  await getDB()
    .update(readinessDocumentTable)
    .set({ extractionStatus: EXTRACTION_STATUS.PROCESSING })
    .where(
      and(
        eq(readinessDocumentTable.id, input.documentId),
        eq(readinessDocumentTable.sessionId, input.sessionId),
      ),
    );
}

export async function markDocumentExtractionFailed(input: {
  sessionId: string;
  documentId: string;
  userId: string;
  message: string;
}) {
  const document = await getOwnedDocument(input);
  const encryptedPayload = await sealJson(
    { ...document.payload, extractionError: input.message.slice(0, 300) },
    {
      secret: getReadinessEncryptionSecret(),
      context: documentContext(input.sessionId, input.documentId),
    },
  );

  await getDB()
    .update(readinessDocumentTable)
    .set({ extractionStatus: EXTRACTION_STATUS.FAILED, encryptedPayload, processedAt: new Date() })
    .where(
      and(
        eq(readinessDocumentTable.id, input.documentId),
        eq(readinessDocumentTable.sessionId, input.sessionId),
      ),
    );
}

export async function deleteReadinessSessionRecord(sessionId: string, userId: string) {
  await assertOwnedSession(sessionId, userId);
  const documents = await getDB()
    .select({ r2Key: readinessDocumentTable.r2Key })
    .from(readinessDocumentTable)
    .where(eq(readinessDocumentTable.sessionId, sessionId));

  let bucket: R2Bucket | undefined;
  try {
    bucket = (await getCloudflareContext({ async: true })).env.R2;
  } catch {
    // A local database-only test may not have R2. Production fails closed below.
  }

  if (documents.length > 0 && !bucket && process.env.NODE_ENV === "production") {
    throw new Error("Document storage unavailable; session was not deleted");
  }

  if (bucket) {
    await Promise.all(documents.map(({ r2Key }) => bucket.delete(r2Key)));
  }

  await getDB()
    .delete(readinessSessionTable)
    .where(
      and(eq(readinessSessionTable.id, sessionId), eq(readinessSessionTable.userId, userId)),
    );
}
