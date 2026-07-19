import { describe, expect, it } from "vitest";
import { extractText, getDocumentProxy } from "unpdf";

import { buildSyntheticDemoPdf } from "./demo-documents";

describe("built-in synthetic demo documents", () => {
  it("generates a valid pay-statement PDF with deterministic extraction labels", () => {
    const bytes = buildSyntheticDemoPdf("pay_stub");
    const text = new TextDecoder().decode(bytes);

    expect(text.startsWith("%PDF-")).toBe(true);
    expect(text).toContain("REALDOOR PRACTICE PAY STATEMENT");
    expect(text).toContain("Gross monthly pay: $4,200.00");
  });

  it("generates a benefits-letter PDF without embedding an eligibility claim", () => {
    const text = new TextDecoder().decode(buildSyntheticDemoPdf("benefits_letter"));

    expect(text).toContain("REALDOOR PRACTICE BENEFITS LETTER");
    expect(text).toContain("Monthly benefits: $900.00");
    expect(text.toLowerCase()).not.toContain("eligible");
    expect(text.toLowerCase()).not.toContain("approved");
  });

  it("produces documents that the production PDF reader can parse", async () => {
    const pdf = await getDocumentProxy(buildSyntheticDemoPdf("pay_stub"));
    const extracted = await extractText(pdf, { mergePages: true });

    expect(pdf.numPages).toBe(1);
    expect(extracted.text).toContain("Gross monthly pay: $4,200.00");
  });
});
