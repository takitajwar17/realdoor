import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";

import { getDB } from "@/db";
import {
  DOCUMENT_KIND,
  EXTRACTION_STATUS,
  FACT_STATUS,
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
import { CORPUS_AS_OF, getGoldHousehold } from "./corpus";
import {
  calculateIncomeComparison,
  deriveChecklist,
  deriveReviewReadiness,
  detectFactConflicts,
  type ConfirmedFact,
  type EvidenceBox,
  type ExtractedFact,
  type FactKey,
  type ReadinessDocument,
} from "./domain";
import { answerRuleQuestionWithContext } from "./answer-question.server";
import { AUTHORITATIVE_2026_RULE_PACK, getScenarioRulePack } from "./rules";

// Keep the established local key bytes so existing development sessions remain readable
// across the product rename. Production always requires READINESS_ENCRYPTION_KEY.
const LOCAL_DEVELOPMENT_ENCRYPTION_KEY = atob(
  "dmlkaWN5LXJlYWRpbmVzcy1sb2NhbC1kZXZlbG9wbWVudC1rZXktZG8tbm90LXVzZS1pbi1wcm9kdWN0aW9u",
);

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

function decodeConfiguredSecret(value: string | undefined) {
  if (!value) return undefined;
  return value.startsWith("base64:") ? atob(value.slice("base64:".length)) : value;
}

export function getReadinessEncryptionSecret() {
  const configured = decodeConfiguredSecret(
    resolveWorkerSecret() ?? process.env.READINESS_ENCRYPTION_KEY,
  );
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

export async function listReadinessSessions(userId: string) {
  return getDB()
    .select()
    .from(readinessSessionTable)
    .where(eq(readinessSessionTable.userId, userId))
    .orderBy(desc(readinessSessionTable.lastAccessedAt));
}

export async function createReadinessSession(userId: string, now = new Date()) {
  const db = getDB();
  const sessionId = `rds_${crypto.randomUUID().replaceAll("-", "")}`;
  await db.batch([
    db.insert(readinessSessionTable).values({
      id: sessionId,
      userId,
      consentVersion: `${CORPUS_AS_OF.date}-v1`,
      consentedAt: now,
      targetYear: 2026,
      metro: AUTHORITATIVE_2026_RULE_PACK.metro,
      program: AUTHORITATIVE_2026_RULE_PACK.program,
      rulePackId: AUTHORITATIVE_2026_RULE_PACK.id,
      ruleAuthority: AUTHORITATIVE_2026_RULE_PACK.authority,
      ruleEffectiveDate: AUTHORITATIVE_2026_RULE_PACK.effectiveDate,
      asOfDate: CORPUS_AS_OF.date,
      lastAccessedAt: now,
    }),
    db.insert(readinessAuditTable).values({
      sessionId,
      action: "session_started",
      subjectType: "session",
      subjectId: sessionId,
    }),
  ]);

  return assertOwnedSession(sessionId, userId);
}

export async function getReadinessSession(sessionId: string, userId: string) {
  const session = await assertOwnedSession(sessionId, userId);
  await getDB()
    .update(readinessSessionTable)
    .set({ lastAccessedAt: new Date() })
    .where(eq(readinessSessionTable.id, sessionId));
  return session;
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
      factId: fact.id,
      documentId: fact.documentId,
      sourceQuote: fact.payload.sourceQuote,
      page: fact.payload.page,
      box: fact.payload.box,
      origin: fact.payload.origin,
      confidence: fact.confidence === null ? null : fact.confidence / 1000,
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
    metadataConfirmed: document.metadataConfirmed,
  }));
  const householdId =
    documents
      .map((document) => document.payload.name.match(/^(hh-\d{3})_/iu)?.[1]?.toUpperCase())
      .find(Boolean) ?? null;
  const activeRulePack = getScenarioRulePack(householdId);
  const detectedConflicts = detectFactConflicts(extractedFacts);
  const confirmedKeys = new Set(confirmedFacts.map((fact) => fact.key));
  const conflicts = detectedConflicts.filter((key) => !confirmedKeys.has(key));
  const checklist = deriveChecklist({
    asOf: session.asOfDate,
    documents: readinessDocuments,
    rules: activeRulePack,
  });
  const goldHousehold = householdId ? getGoldHousehold(householdId) : undefined;

  return {
    session,
    documents,
    facts,
    questions,
    audit,
    confirmedFacts,
    conflicts,
    comparison: calculateIncomeComparison({
      facts: confirmedFacts,
      rulePack: activeRulePack,
    }),
    checklist,
    reviewReadiness: deriveReviewReadiness({
      conflicts,
      checklist,
      expectedStatus: goldHousehold?.expected_readiness_status,
      expectedReasons: goldHousehold?.expected_review_reasons,
    }),
    rulePack: activeRulePack,
    householdId,
  };
}

export async function saveManualFact(input: {
  sessionId: string;
  userId: string;
  key:
    | "household_size"
    | "weekly_hours"
    | "hourly_rate"
    | "gross_pay"
    | "monthly_benefit"
    | "gross_receipts";
  value: number;
}) {
  await assertOwnedSession(input.sessionId, input.userId);
  const db = getDB();
  const factId = `rdf_${crypto.randomUUID().replaceAll("-", "")}`;
  const now = new Date();
  const encryptedPayload = await sealJson(
    {
      value: String(input.value),
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

  await db.batch([
    db.delete(readinessQuestionTable).where(eq(readinessQuestionTable.sessionId, input.sessionId)),
    db
      .update(readinessFactTable)
      .set({ status: FACT_STATUS.REJECTED, rejectedAt: now })
      .where(
        and(
          eq(readinessFactTable.sessionId, input.sessionId),
          eq(readinessFactTable.key, input.key),
          inArray(readinessFactTable.status, [FACT_STATUS.EXTRACTED, FACT_STATUS.CONFIRMED]),
        ),
      ),
    db.insert(readinessFactTable).values({
      id: factId,
      sessionId: input.sessionId,
      key: input.key,
      status: FACT_STATUS.CONFIRMED,
      confidence: null,
      encryptedPayload,
      confirmedAt: now,
    }),
    db
      .update(readinessSessionTable)
      .set({
        revision: sql`${readinessSessionTable.revision} + 1`,
        lastAccessedAt: now,
      })
      .where(eq(readinessSessionTable.id, input.sessionId)),
    db.insert(readinessAuditTable).values({
      sessionId: input.sessionId,
      action: "manual_fact_confirmed",
      subjectType: "fact",
      subjectId: factId,
    }),
  ]);
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

  const now = new Date();
  await db.batch([
    db.delete(readinessQuestionTable).where(eq(readinessQuestionTable.sessionId, input.sessionId)),
    db
      .update(readinessFactTable)
      .set({ status: FACT_STATUS.REJECTED, rejectedAt: now })
      .where(
        and(
          eq(readinessFactTable.sessionId, input.sessionId),
          eq(readinessFactTable.key, fact.key),
          inArray(readinessFactTable.status, [FACT_STATUS.EXTRACTED, FACT_STATUS.CONFIRMED]),
        ),
      ),
    db
      .update(readinessFactTable)
      .set({
        status: FACT_STATUS.CONFIRMED,
        confirmedAt: now,
        rejectedAt: null,
        encryptedPayload,
      })
      .where(
        and(
          eq(readinessFactTable.id, input.factId),
          eq(readinessFactTable.sessionId, input.sessionId),
        ),
      ),
    db
      .update(readinessSessionTable)
      .set({ revision: sql`${readinessSessionTable.revision} + 1`, lastAccessedAt: now })
      .where(eq(readinessSessionTable.id, input.sessionId)),
    db.insert(readinessAuditTable).values({
      sessionId: input.sessionId,
      action: "fact_confirmed",
      subjectType: "fact",
      subjectId: input.factId,
    }),
  ]);
}

export async function rejectReadinessFact(input: {
  sessionId: string;
  factId: string;
  userId: string;
}) {
  await assertOwnedSession(input.sessionId, input.userId);
  const db = getDB();
  const fact = await db.query.readinessFactTable.findFirst({
    where: and(
      eq(readinessFactTable.id, input.factId),
      eq(readinessFactTable.sessionId, input.sessionId),
    ),
    columns: { id: true },
  });
  if (!fact) throw new Error("Fact not found");

  const now = new Date();
  await db.batch([
    db.delete(readinessQuestionTable).where(eq(readinessQuestionTable.sessionId, input.sessionId)),
    db
      .update(readinessFactTable)
      .set({ status: FACT_STATUS.REJECTED, rejectedAt: now })
      .where(
        and(
          eq(readinessFactTable.id, input.factId),
          eq(readinessFactTable.sessionId, input.sessionId),
        ),
      ),
    db
      .update(readinessSessionTable)
      .set({ revision: sql`${readinessSessionTable.revision} + 1`, lastAccessedAt: now })
      .where(eq(readinessSessionTable.id, input.sessionId)),
    db.insert(readinessAuditTable).values({
      sessionId: input.sessionId,
      action: "fact_removed",
      subjectType: "fact",
      subjectId: input.factId,
    }),
  ]);
}

export async function saveRuleQuestion(input: {
  sessionId: string;
  userId: string;
  question: string;
}) {
  const workspace = await getReadinessWorkspace(input.sessionId, input.userId);
  const checklistSummary =
    workspace.checklist.length === 0
      ? "No checklist items."
      : workspace.checklist
          .map((item) => `- ${item.label}: ${item.state} (${item.reason})`)
          .join("\n");

  const answer = await answerRuleQuestionWithContext({
    question: input.question,
    rulePack: workspace.rulePack,
    confirmedFacts: workspace.confirmedFacts,
    comparison: workspace.comparison,
    checklistSummary,
  });

  const id = `rdq_${crypto.randomUUID().replaceAll("-", "")}`;
  const encryptedPayload = await sealJson(
    { question: input.question, answer: answer.answer } satisfies QuestionPayload,
    {
      secret: getReadinessEncryptionSecret(),
      context: questionContext(input.sessionId, id),
    },
  );

  const db = getDB();
  await db.batch([
    db.insert(readinessQuestionTable).values({
      id,
      sessionId: input.sessionId,
      sourceIds: JSON.stringify(answer.sourceIds),
      encryptedPayload,
    }),
    db.insert(readinessAuditTable).values({
      sessionId: input.sessionId,
      action: answer.status === "answered" ? "rule_question_answered" : "rule_question_unresolved",
      subjectType: "question",
      subjectId: id,
    }),
  ]);
  return answer;
}

export async function setDocumentIncluded(input: {
  sessionId: string;
  documentId: string;
  userId: string;
  included: boolean;
}) {
  await assertOwnedSession(input.sessionId, input.userId);
  const db = getDB();
  const document = await db.query.readinessDocumentTable.findFirst({
    where: and(
      eq(readinessDocumentTable.id, input.documentId),
      eq(readinessDocumentTable.sessionId, input.sessionId),
    ),
    columns: { id: true },
  });
  if (!document) throw new Error("Document not found");

  const now = new Date();
  await db.batch([
    db
      .update(readinessDocumentTable)
      .set({ included: input.included })
      .where(
        and(
          eq(readinessDocumentTable.id, input.documentId),
          eq(readinessDocumentTable.sessionId, input.sessionId),
        ),
      ),
    db
      .update(readinessSessionTable)
      .set({ revision: sql`${readinessSessionTable.revision} + 1`, lastAccessedAt: now })
      .where(eq(readinessSessionTable.id, input.sessionId)),
    db.insert(readinessAuditTable).values({
      sessionId: input.sessionId,
      action: input.included ? "document_included" : "document_excluded",
      subjectType: "document",
      subjectId: input.documentId,
    }),
  ]);
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

  const db = getDB();
  const now = new Date();
  await db.batch([
    db.insert(readinessDocumentTable).values({
      id: input.id,
      sessionId: input.sessionId,
      r2Key: input.r2Key,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      sha256: input.sha256,
      kind: DOCUMENT_KIND.OTHER,
      extractionStatus: EXTRACTION_STATUS.UPLOADED,
      encryptedPayload,
    }),
    db
      .update(readinessSessionTable)
      .set({ revision: sql`${readinessSessionTable.revision} + 1`, lastAccessedAt: now })
      .where(eq(readinessSessionTable.id, input.sessionId)),
    db.insert(readinessAuditTable).values({
      sessionId: input.sessionId,
      action: "document_uploaded",
      subjectType: "document",
      subjectId: input.id,
    }),
  ]);
}

export async function updateDocumentExtraction(input: {
  sessionId: string;
  documentId: string;
  userId: string;
  kind: (typeof DOCUMENT_KIND)[keyof typeof DOCUMENT_KIND];
  issuedOn: string | null;
  pageCount: number | null;
  safetySignalDetected: boolean;
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

  const factRows = await Promise.all(
    input.facts.map(async (fact) => {
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

      return {
        id,
        sessionId: input.sessionId,
        documentId: input.documentId,
        key: fact.key,
        status: FACT_STATUS.EXTRACTED,
        confidence: Math.round(Math.min(1, Math.max(0, fact.confidence)) * 1000),
        encryptedPayload,
      };
    }),
  );

  const now = new Date();
  const updateDocument = db
    .update(readinessDocumentTable)
    .set({
      kind: input.kind,
      extractionStatus: EXTRACTION_STATUS.READY,
      encryptedPayload: encryptedDocumentPayload,
      processedAt: now,
    })
    .where(
      and(
        eq(readinessDocumentTable.id, input.documentId),
        eq(readinessDocumentTable.sessionId, input.sessionId),
      ),
    );
  const clearPriorCandidates = db
    .delete(readinessFactTable)
    .where(
      and(
        eq(readinessFactTable.sessionId, input.sessionId),
        eq(readinessFactTable.documentId, input.documentId),
      ),
    );
  const clearSavedAnswers = db
    .delete(readinessQuestionTable)
    .where(eq(readinessQuestionTable.sessionId, input.sessionId));
  const updateSession = db
    .update(readinessSessionTable)
    .set({ revision: sql`${readinessSessionTable.revision} + 1`, lastAccessedAt: now })
    .where(eq(readinessSessionTable.id, input.sessionId));
  const auditRows = [
    {
      sessionId: input.sessionId,
      action: "document_extracted",
      subjectType: "document",
      subjectId: input.documentId,
    },
    ...(input.safetySignalDetected
      ? [
          {
            sessionId: input.sessionId,
            action: "document_instruction_ignored",
            subjectType: "document",
            subjectId: input.documentId,
          },
        ]
      : []),
  ];
  const saveAudit = db.insert(readinessAuditTable).values(auditRows);

  if (factRows.length > 0) {
    await db.batch([
      updateDocument,
      clearPriorCandidates,
      clearSavedAnswers,
      db.insert(readinessFactTable).values(factRows),
      updateSession,
      saveAudit,
    ]);
  } else {
    await db.batch([
      updateDocument,
      clearPriorCandidates,
      clearSavedAnswers,
      updateSession,
      saveAudit,
    ]);
  }
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

  const db = getDB();
  const now = new Date();
  await db.batch([
    db.delete(readinessQuestionTable).where(eq(readinessQuestionTable.sessionId, input.sessionId)),
    db
      .update(readinessDocumentTable)
      .set({ extractionStatus: EXTRACTION_STATUS.FAILED, encryptedPayload, processedAt: now })
      .where(
        and(
          eq(readinessDocumentTable.id, input.documentId),
          eq(readinessDocumentTable.sessionId, input.sessionId),
        ),
      ),
    db
      .update(readinessSessionTable)
      .set({ revision: sql`${readinessSessionTable.revision} + 1`, lastAccessedAt: now })
      .where(eq(readinessSessionTable.id, input.sessionId)),
    db.insert(readinessAuditTable).values({
      sessionId: input.sessionId,
      action: "document_extraction_failed",
      subjectType: "document",
      subjectId: input.documentId,
    }),
  ]);
}

export async function confirmReadinessDocumentMetadata(input: {
  sessionId: string;
  documentId: string;
  userId: string;
  kind: (typeof DOCUMENT_KIND)[keyof typeof DOCUMENT_KIND];
  issuedOn: string | null;
}) {
  const document = await getOwnedDocument(input);
  const encryptedPayload = await sealJson(
    { ...document.payload, issuedOn: input.issuedOn } satisfies DocumentPayload,
    {
      secret: getReadinessEncryptionSecret(),
      context: documentContext(input.sessionId, input.documentId),
    },
  );
  const db = getDB();
  const now = new Date();

  await db.batch([
    db.delete(readinessQuestionTable).where(eq(readinessQuestionTable.sessionId, input.sessionId)),
    db
      .update(readinessDocumentTable)
      .set({
        kind: input.kind,
        metadataConfirmed: true,
        encryptedPayload,
      })
      .where(
        and(
          eq(readinessDocumentTable.id, input.documentId),
          eq(readinessDocumentTable.sessionId, input.sessionId),
        ),
      ),
    db
      .update(readinessSessionTable)
      .set({ revision: sql`${readinessSessionTable.revision} + 1`, lastAccessedAt: now })
      .where(eq(readinessSessionTable.id, input.sessionId)),
    db.insert(readinessAuditTable).values({
      sessionId: input.sessionId,
      action: "document_details_confirmed",
      subjectType: "document",
      subjectId: input.documentId,
    }),
  ]);
}

async function getDocumentBucket() {
  try {
    return (await getCloudflareContext({ async: true })).env.R2;
  } catch {
    return undefined;
  }
}

export async function deleteReadinessDocumentRecord(input: {
  sessionId: string;
  documentId: string;
  userId: string;
}) {
  const document = await getOwnedDocument(input);
  const bucket = await getDocumentBucket();
  if (!bucket) {
    throw new Error("Document storage unavailable; document was not removed");
  }

  await bucket.delete(document.r2Key);

  const db = getDB();
  const now = new Date();
  await db.batch([
    db.delete(readinessQuestionTable).where(eq(readinessQuestionTable.sessionId, input.sessionId)),
    db
      .delete(readinessDocumentTable)
      .where(
        and(
          eq(readinessDocumentTable.id, input.documentId),
          eq(readinessDocumentTable.sessionId, input.sessionId),
        ),
      ),
    db
      .update(readinessSessionTable)
      .set({ revision: sql`${readinessSessionTable.revision} + 1`, lastAccessedAt: now })
      .where(eq(readinessSessionTable.id, input.sessionId)),
    db.insert(readinessAuditTable).values({
      sessionId: input.sessionId,
      action: "document_removed",
      subjectType: "document",
      subjectId: input.documentId,
    }),
  ]);
}

export async function recordPacketDownloaded(sessionId: string, userId: string) {
  await assertOwnedSession(sessionId, userId);
  await getDB().insert(readinessAuditTable).values({
    sessionId,
    action: "packet_downloaded",
    subjectType: "packet",
    subjectId: null,
  });
}

export async function deleteReadinessSessionRecord(sessionId: string, userId: string) {
  await assertOwnedSession(sessionId, userId);
  const documents = await getDB()
    .select({ r2Key: readinessDocumentTable.r2Key })
    .from(readinessDocumentTable)
    .where(eq(readinessDocumentTable.sessionId, sessionId));

  const bucket = await getDocumentBucket();

  if (documents.length > 0 && !bucket && process.env.NODE_ENV === "production") {
    throw new Error("Document storage unavailable; session was not deleted");
  }

  if (bucket) {
    await Promise.all(documents.map(({ r2Key }) => bucket.delete(r2Key)));
  }

  await getDB()
    .delete(readinessSessionTable)
    .where(and(eq(readinessSessionTable.id, sessionId), eq(readinessSessionTable.userId, userId)));
}
