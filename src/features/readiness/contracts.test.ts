import { describe, expect, it } from "vitest";

import {
  confirmFactSchema,
  createSessionSchema,
  hasValidFileSignature,
  manualFactSchema,
  documentMetadataSchema,
  parseDocumentUploadMetadata,
  ruleQuestionSchema,
} from "./contracts";

describe("readiness request contracts", () => {
  it("requires explicit consent and an explicit synthetic-rehearsal choice", () => {
    expect(
      createSessionSchema.safeParse({ consent: false, useSyntheticRehearsal: true }).success,
    ).toBe(false);
    expect(
      createSessionSchema.safeParse({ consent: true, useSyntheticRehearsal: false }).success,
    ).toBe(false);
    expect(
      createSessionSchema.safeParse({ consent: true, useSyntheticRehearsal: true }).success,
    ).toBe(true);
  });

  it("accepts bounded non-negative manual income facts", () => {
    expect(
      manualFactSchema.safeParse({
        sessionId: "rds_abc123",
        key: "household_size",
        value: 2,
      }).success,
    ).toBe(true);

    expect(
      manualFactSchema.safeParse({
        sessionId: "rds_abc123",
        key: "household_size",
        value: 9,
      }).success,
    ).toBe(false);
    expect(
      manualFactSchema.safeParse({
        sessionId: "rds_abc123",
        key: "employment_monthly_income",
        value: 4200,
      }).success,
    ).toBe(true);
  });

  it("validates renter-confirmed document type and date corrections", () => {
    expect(
      documentMetadataSchema.safeParse({
        sessionId: "rds_abc123",
        documentId: "rdd_doc123",
        kind: "pay_stub",
        issuedOn: "2026-07-01",
      }).success,
    ).toBe(true);
    expect(
      documentMetadataSchema.safeParse({
        sessionId: "rds_abc123",
        documentId: "rdd_doc123",
        kind: "passport",
        issuedOn: "not-a-date",
      }).success,
    ).toBe(false);
  });

  it("allows only the supported document media types and a 10 MB maximum", () => {
    expect(
      parseDocumentUploadMetadata({
        name: "pay-stub.pdf",
        type: "application/pdf",
        size: 10 * 1024 * 1024,
      }),
    ).toMatchObject({ type: "application/pdf", extension: "pdf" });

    expect(() =>
      parseDocumentUploadMetadata({
        name: "payload.html",
        type: "text/html",
        size: 100,
      }),
    ).toThrow("PDF, JPEG, or PNG");

    expect(() =>
      parseDocumentUploadMetadata({
        name: "scan.png",
        type: "image/png",
        size: 10 * 1024 * 1024 + 1,
      }),
    ).toThrow("10 MB");
  });

  it("does not let a confirmation mutation address another session namespace", () => {
    expect(
      confirmFactSchema.safeParse({
        sessionId: "application_legacy",
        factId: "rdf_fact",
        value: "4200",
      }).success,
    ).toBe(false);
  });

  it("bounds rule questions before they reach the frozen-corpus answerer", () => {
    expect(
      ruleQuestionSchema.safeParse({
        sessionId: "rds_abc123",
        question: "How is income annualized?",
      }).success,
    ).toBe(true);
    expect(
      ruleQuestionSchema.safeParse({ sessionId: "rds_abc123", question: "x".repeat(1001) }).success,
    ).toBe(false);
  });

  it("checks PDF, PNG, and JPEG magic bytes before storage", () => {
    expect(hasValidFileSignature(new TextEncoder().encode("%PDF-1.7"), "application/pdf")).toBe(
      true,
    );
    expect(
      hasValidFileSignature(
        Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        "image/png",
      ),
    ).toBe(true);
    expect(hasValidFileSignature(Uint8Array.from([0xff, 0xd8, 0xff]), "image/jpeg")).toBe(true);
    expect(hasValidFileSignature(new TextEncoder().encode("<html>"), "application/pdf")).toBe(
      false,
    );
  });
});
