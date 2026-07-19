import { describe, expect, it } from "vitest";

import { renderReadinessPacket, type PacketModel } from "./packet";

const model: PacketModel = {
  sessionId: "rds_test",
  revision: 7,
  generatedAt: "2026-07-18 14:00 America/New_York",
  metro: "Boston-Cambridge-Quincy, MA-NH HMFA",
  program: "LIHTC · frozen 60% MTSP comparison",
  asOfDate: "2026-07-18",
  timezone: "America/New_York",
  ruleVersion: "RealDoor organizer corpus v1 · 2026-07-18",
  ruleEffectiveDate: "2026-05-01",
  facts: [{ label: "Gross pay", value: "$2,166", source: "pay.pdf", sourceQuote: "2166", page: 1 }],
  worksheet: { status: "complete", annualIncome: 56_316, incomeLimit: 72_000, difference: -15_684, formula: "$2,166 × 26 = $56,316" },
  checklist: [{ label: "Recent pay statement", state: "Present", reason: "21 ≤ 60", sourceId: "CH-READINESS-001" }],
  documents: [{ name: "pay.pdf", kind: "Pay statement", issuedOn: "2026-06-27" }],
  questions: [{ question: "Can I be approved?", answer: "A human decides.", sourceIds: ["CH-DECISION-001"] }],
  sources: [{ id: "HUD-MTSP-002", title: "PDF page 130", locator: "PDF page 130", url: "https://example.test", passage: "Frozen passage" }],
};

describe("renter-controlled packet", () => {
  it("renders complete, assistive-technology-readable evidence and decision boundaries", () => {
    const html = renderReadinessPacket(model);
    expect(html).toContain("Not an eligibility decision");
    expect(html).toContain("$2,166 × 26 = $56,316");
    expect(html).toContain("PDF page 130");
    expect(html).toContain("Downloaded to you; not sent");
    expect(html).toContain('scope="col"');
  });

  it("is byte-identical for preview and download when the model revision is unchanged", () => {
    expect(renderReadinessPacket(model)).toBe(renderReadinessPacket(structuredClone(model)));
  });

  it("contains no stale prior value after a correction model replaces it", () => {
    const corrected = structuredClone(model);
    corrected.facts[0]!.value = "$2,100";
    corrected.facts[0]!.sourceQuote = "2100";
    corrected.worksheet.formula = "$2,100 × 26 = $54,600";
    corrected.worksheet.annualIncome = 54_600;
    corrected.worksheet.difference = -17_400;
    const html = renderReadinessPacket(corrected);
    expect(html).toContain("$2,100");
    expect(html).not.toContain("$2,166");
    expect(html).not.toContain("$56,316");
  });
});
