import { createId } from "@paralleldrive/cuid2";
import { relations, type InferSelectModel } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import { commonColumns } from "./_common";
import { userTable } from "./user";

export const DOCUMENT_KIND = {
  APPLICATION_SUMMARY: "application_summary",
  PAY_STUB: "pay_stub",
  EMPLOYMENT_LETTER: "employment_letter",
  BENEFIT_LETTER: "benefit_letter",
  GIG_STATEMENT: "gig_statement",
  GIG_INCOME_CORROBORATION: "gig_income_corroboration",
  OTHER: "other",
} as const;

export const EXTRACTION_STATUS = {
  UPLOADED: "uploaded",
  PROCESSING: "processing",
  READY: "ready",
  FAILED: "failed",
} as const;

export const FACT_STATUS = {
  EXTRACTED: "extracted",
  CONFIRMED: "confirmed",
  REJECTED: "rejected",
} as const;

const tuple = <T extends Record<string, string>>(values: T) =>
  Object.values(values) as [T[keyof T], ...T[keyof T][]];

export const readinessSessionTable = sqliteTable(
  "readiness_session",
  {
    ...commonColumns,
    id: text()
      .primaryKey()
      .$defaultFn(() => `rds_${createId()}`)
      .notNull(),
    userId: text()
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    encryptedName: text(),
    consentVersion: text().notNull(),
    consentedAt: integer({ mode: "timestamp" }).notNull(),
    targetYear: integer().default(2026).notNull(),
    metro: text().notNull(),
    program: text().notNull(),
    rulePackId: text().notNull(),
    ruleAuthority: text({ enum: ["official", "organizer"] }).notNull(),
    ruleEffectiveDate: text().notNull(),
    asOfDate: text().notNull(),
    revision: integer().default(1).notNull(),
    lastAccessedAt: integer({ mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("readiness_session_user_updated_idx").on(table.userId, table.updatedAt),
    index("readiness_session_user_accessed_idx").on(table.userId, table.lastAccessedAt),
  ],
);

export const readinessDocumentTable = sqliteTable(
  "readiness_document",
  {
    ...commonColumns,
    id: text()
      .primaryKey()
      .$defaultFn(() => `rdd_${createId()}`)
      .notNull(),
    sessionId: text()
      .notNull()
      .references(() => readinessSessionTable.id, { onDelete: "cascade" }),
    r2Key: text().notNull(),
    mimeType: text({ enum: ["application/pdf", "image/jpeg", "image/png"] }).notNull(),
    sizeBytes: integer().notNull(),
    sha256: text().notNull(),
    kind: text({ enum: tuple(DOCUMENT_KIND) })
      .default(DOCUMENT_KIND.OTHER)
      .notNull(),
    extractionStatus: text({ enum: tuple(EXTRACTION_STATUS) })
      .default(EXTRACTION_STATUS.UPLOADED)
      .notNull(),
    metadataConfirmed: integer({ mode: "boolean" }).default(false).notNull(),
    included: integer({ mode: "boolean" }).default(true).notNull(),
    encryptedPayload: text().notNull(),
    processedAt: integer({ mode: "timestamp" }),
  },
  (table) => [
    index("readiness_document_session_idx").on(table.sessionId, table.createdAt),
    uniqueIndex("readiness_document_r2_key_idx").on(table.r2Key),
    index("readiness_document_status_idx").on(table.sessionId, table.extractionStatus),
  ],
);

export const readinessFactTable = sqliteTable(
  "readiness_fact",
  {
    ...commonColumns,
    id: text()
      .primaryKey()
      .$defaultFn(() => `rdf_${createId()}`)
      .notNull(),
    sessionId: text()
      .notNull()
      .references(() => readinessSessionTable.id, { onDelete: "cascade" }),
    documentId: text().references(() => readinessDocumentTable.id, { onDelete: "cascade" }),
    key: text().notNull(),
    status: text({ enum: tuple(FACT_STATUS) })
      .default(FACT_STATUS.EXTRACTED)
      .notNull(),
    confidence: integer(),
    encryptedPayload: text().notNull(),
    confirmedAt: integer({ mode: "timestamp" }),
    rejectedAt: integer({ mode: "timestamp" }),
  },
  (table) => [
    index("readiness_fact_session_key_idx").on(table.sessionId, table.key, table.status),
    index("readiness_fact_document_idx").on(table.documentId),
  ],
);

export const readinessQuestionTable = sqliteTable(
  "readiness_question",
  {
    ...commonColumns,
    id: text()
      .primaryKey()
      .$defaultFn(() => `rdq_${createId()}`)
      .notNull(),
    sessionId: text()
      .notNull()
      .references(() => readinessSessionTable.id, { onDelete: "cascade" }),
    sourceIds: text().notNull(),
    encryptedPayload: text().notNull(),
  },
  (table) => [index("readiness_question_session_idx").on(table.sessionId, table.createdAt)],
);

export const readinessAuditTable = sqliteTable(
  "readiness_audit",
  {
    createdAt: integer({ mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
    id: text()
      .primaryKey()
      .$defaultFn(() => `rda_${createId()}`)
      .notNull(),
    sessionId: text()
      .notNull()
      .references(() => readinessSessionTable.id, { onDelete: "cascade" }),
    action: text().notNull(),
    subjectType: text().notNull(),
    subjectId: text(),
  },
  (table) => [index("readiness_audit_session_idx").on(table.sessionId, table.createdAt)],
);

export const readinessSessionRelations = relations(readinessSessionTable, ({ one, many }) => ({
  user: one(userTable, {
    fields: [readinessSessionTable.userId],
    references: [userTable.id],
  }),
  documents: many(readinessDocumentTable),
  facts: many(readinessFactTable),
  questions: many(readinessQuestionTable),
  audit: many(readinessAuditTable),
}));

export const readinessDocumentRelations = relations(readinessDocumentTable, ({ one, many }) => ({
  session: one(readinessSessionTable, {
    fields: [readinessDocumentTable.sessionId],
    references: [readinessSessionTable.id],
  }),
  facts: many(readinessFactTable),
}));

export const readinessFactRelations = relations(readinessFactTable, ({ one }) => ({
  session: one(readinessSessionTable, {
    fields: [readinessFactTable.sessionId],
    references: [readinessSessionTable.id],
  }),
  document: one(readinessDocumentTable, {
    fields: [readinessFactTable.documentId],
    references: [readinessDocumentTable.id],
  }),
}));

export type ReadinessSession = InferSelectModel<typeof readinessSessionTable>;
export type ReadinessDocumentRecord = InferSelectModel<typeof readinessDocumentTable>;
export type ReadinessFactRecord = InferSelectModel<typeof readinessFactTable>;
