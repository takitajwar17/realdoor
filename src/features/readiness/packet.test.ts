import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";
import { extractText, getDocumentProxy } from "unpdf";

import { preparePacketFactEvidence, renderReadinessPacket, type PacketModel } from "./packet";

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
  worksheet: {
    status: "complete",
    annualIncome: 56_316,
    incomeLimit: 72_000,
    difference: -15_684,
    formula: "$2,166 × 26 = $56,316",
  },
  checklist: [
    {
      label: "Recent pay statement",
      state: "Present",
      reason: "21 ≤ 60",
      sourceId: "CH-READINESS-001",
    },
  ],
  documents: [{ name: "pay.pdf", kind: "Pay statement", issuedOn: "2026-06-27" }],
  questions: [
    { question: "Can I be approved?", answer: "A human decides.", sourceIds: ["CH-DECISION-001"] },
  ],
  sources: [
    {
      id: "HUD-MTSP-002",
      title: "PDF page 130",
      locator: "PDF page 130",
      url: "https://example.test",
      passage: "Frozen passage",
    },
  ],
};

describe("renter-controlled packet", () => {
  const logoBytes = readFile(
    "public/logo/light/transparent_logo_text_horizontal_nobuffer.png",
  );

  it("does not carry a superseded document value into the packet", () => {
    expect(
      preparePacketFactEvidence({
        value: "25",
        sourceQuote: "24",
        documentName: "employment-letter.pdf",
      }),
    ).toEqual({
      source: "Corrected by renter from employment-letter.pdf",
      sourceQuote: null,
    });
  });

  it("renders a valid selectable-text PDF with evidence and decision boundaries", async () => {
    const bytes = await renderReadinessPacket(model, await logoBytes);
    const header = new TextDecoder().decode(bytes.slice(0, 5));
    const pdf = await getDocumentProxy(bytes);
    const extracted = await extractText(pdf, { mergePages: true });

    expect(header).toBe("%PDF-");
    expect(pdf.numPages).toBeGreaterThan(1);
    expect(extracted.text).toContain("Not an eligibility decision");
    expect(extracted.text).toContain("$2,166 x 26 = $56,316");
    expect(extracted.text).toContain("PDF page 130");
    expect(extracted.text).toContain("Downloaded to you; not sent");
  });

  it("is byte-identical for preview and download when the model revision is unchanged", async () => {
    expect(await renderReadinessPacket(model, await logoBytes)).toEqual(
      await renderReadinessPacket(structuredClone(model), await logoBytes),
    );
  });

  it("contains no stale prior value after a correction model replaces it", async () => {
    const corrected = structuredClone(model);
    corrected.facts[0]!.value = "$2,100";
    corrected.facts[0]!.sourceQuote = "2100";
    corrected.worksheet.formula = "$2,100 × 26 = $54,600";
    corrected.worksheet.annualIncome = 54_600;
    corrected.worksheet.difference = -17_400;
    const pdf = await getDocumentProxy(await renderReadinessPacket(corrected, await logoBytes));
    const extracted = await extractText(pdf, { mergePages: true });
    expect(extracted.text).toContain("$2,100");
    expect(extracted.text).not.toContain("$2,166");
    expect(extracted.text).not.toContain("$56,316");
  });
});
