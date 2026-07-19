import { getTableName } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/sqlite-core";
import { describe, expect, it } from "vitest";

import {
  readinessAuditTable,
  readinessDocumentTable,
  readinessFactTable,
  readinessQuestionTable,
  readinessSessionTable,
} from "./readiness";

describe("readiness persistence schema", () => {
  it("uses a small session-owned table set with opaque public ids", () => {
    expect(
      [
        readinessSessionTable,
        readinessDocumentTable,
        readinessFactTable,
        readinessQuestionTable,
        readinessAuditTable,
      ].map(getTableName),
    ).toEqual([
      "readiness_session",
      "readiness_document",
      "readiness_fact",
      "readiness_question",
      "readiness_audit",
    ]);

    expect(readinessSessionTable.id.dataType).toBe("string");
    expect(readinessDocumentTable.id.dataType).toBe("string");
  });

  it("keeps renter content inside encrypted payload columns", () => {
    const sessionColumns = getTableConfig(readinessSessionTable)
      .columns.map((column) => column.name)
      .sort();
    const documentColumns = getTableConfig(readinessDocumentTable)
      .columns.map((column) => column.name)
      .sort();
    const factColumns = getTableConfig(readinessFactTable)
      .columns.map((column) => column.name)
      .sort();
    const questionColumns = getTableConfig(readinessQuestionTable)
      .columns.map((column) => column.name)
      .sort();

    expect(documentColumns).toContain("encryptedPayload");
    expect(documentColumns).toContain("metadataConfirmed");
    expect(factColumns).toContain("encryptedPayload");
    expect(questionColumns).toContain("encryptedPayload");
    expect(sessionColumns).toContain("encryptedName");
    expect(sessionColumns).not.toContain("stage");

    expect(sessionColumns).not.toContain("name");

    expect(documentColumns).not.toContain("fileName");
    expect(factColumns).not.toContain("value");
    expect(questionColumns).not.toContain("question");
  });

  it("indexes every ownership and session lookup used by protected routes", () => {
    const sessionIndexes = getTableConfig(readinessSessionTable).indexes.map(
      (index) => index.config.name,
    );
    const documentIndexes = getTableConfig(readinessDocumentTable).indexes.map(
      (index) => index.config.name,
    );
    const factIndexes = getTableConfig(readinessFactTable).indexes.map(
      (index) => index.config.name,
    );

    expect(sessionIndexes).toContain("readiness_session_user_updated_idx");
    expect(documentIndexes).toContain("readiness_document_session_idx");
    expect(factIndexes).toContain("readiness_fact_session_key_idx");
  });
});
