import { describe, expect, it } from "vitest";

import { APPLICATION_CHECKLISTS, DOCUMENT_GOLD } from "./corpus";
import {
  buildAuditEntry,
  calculateIncomeComparison,
  deriveChecklist,
  detectFactConflicts,
  summarizeConfirmedIncome,
  type ConfirmedFact,
} from "./domain";
import { AUTHORITATIVE_2026_RULE_PACK } from "./rules";

function confirmedFactsFor(householdId: string): ConfirmedFact[] {
  return DOCUMENT_GOLD.filter((document) => document.householdId === householdId).flatMap(
    (document) =>
      document.fields
        .filter((field) => field.field !== "untrusted_instruction_text")
        .map((field) => ({
          key: field.field as ConfirmedFact["key"],
          value: String(field.value),
          status: "confirmed" as const,
          updatedAt: "2026-07-18T12:00:00.000Z",
        })),
  );
}

describe("frozen annualization and threshold comparison", () => {
  it.each(APPLICATION_CHECKLISTS)(
    "reproduces the organizer calculation for $household_id",
    (scenario) => {
      const facts = confirmedFactsFor(scenario.household_id);
      const income = summarizeConfirmedIncome(facts);
      const comparison = calculateIncomeComparison({
        facts,
        rulePack: AUTHORITATIVE_2026_RULE_PACK,
      });

      expect(income.annualIncome).toBe(scenario.expected_annualized_income);
      expect(comparison).toMatchObject({
        status: "complete",
        annualIncome: scenario.expected_annualized_income,
        incomeLimit: scenario.frozen_60_percent_threshold,
      });
      expect(comparison).not.toHaveProperty("eligible");
      expect(comparison).not.toHaveProperty("score");
    },
  );

  it("keeps conflicting pay-stub totals visible for review", () => {
    const conflicts = detectFactConflicts(
      DOCUMENT_GOLD.filter((document) => document.householdId === "HH-002")
        .flatMap((document) => document.fields)
        .filter((field) => field.field === "gross_pay")
        .map((field) => ({
          key: "gross_pay" as const,
          value: String(field.value),
          confidence: 1,
          sourceQuote: String(field.value),
          page: field.page,
          status: "extracted" as const,
        })),
    );
    expect(conflicts).toEqual(["gross_pay"]);
  });

  it("abstains until an income source and household size are confirmed", () => {
    expect(summarizeConfirmedIncome([])).toMatchObject({
      status: "unresolved",
      annualIncome: null,
    });
    expect(
      calculateIncomeComparison({
        facts: confirmedFactsFor("HH-001").filter((fact) => fact.key !== "household_size"),
        rulePack: AUTHORITATIVE_2026_RULE_PACK,
      }),
    ).toMatchObject({ status: "unresolved", incomeLimit: null });
  });
});

describe("frozen checklist arithmetic", () => {
  it("exposes present, missing, expired, and unresolved as text states", () => {
    const result = deriveChecklist({
      asOf: "2026-07-18",
      documents: [
        {
          id: "summary",
          kind: "application_summary",
          name: "summary.pdf",
          issuedOn: "2026-07-10",
          included: true,
          metadataConfirmed: true,
        },
        {
          id: "pay",
          kind: "pay_stub",
          name: "pay.pdf",
          issuedOn: null,
          included: true,
          metadataConfirmed: true,
        },
        {
          id: "letter",
          kind: "employment_letter",
          name: "letter.pdf",
          issuedOn: "2026-04-14",
          included: true,
          metadataConfirmed: true,
        },
      ],
      rules: AUTHORITATIVE_2026_RULE_PACK,
    });
    expect(result.map((item) => item.state)).toEqual(["present", "unresolved", "expired"]);
    expect(result[2]?.reason).toContain("95 days old");
    expect(result[2]?.reason).toContain("60-day window");
  });

  it("marks an absent required type missing", () => {
    const result = deriveChecklist({
      asOf: "2026-07-18",
      documents: [],
      rules: AUTHORITATIVE_2026_RULE_PACK,
    });
    expect(result.every((item) => item.state === "missing")).toBe(true);
  });
});

describe("content-free audit trail", () => {
  it("stores actions and identifiers without renter content", () => {
    const entry = buildAuditEntry({
      action: "fact_confirmed",
      sessionId: "rds_123",
      subjectId: "fact_123",
      occurredAt: "2026-07-18T10:00:00.000Z",
    });
    expect(JSON.stringify(entry)).not.toContain("Mara North");
  });
});
