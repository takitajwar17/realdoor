import { describe, expect, it } from "vitest";

import { buildSyntheticDemoPdf } from "./demo-documents";

describe("built-in synthetic demo documents", () => {
  it("generates a valid pay-statement PDF with deterministic extraction labels", () => {
    const bytes = buildSyntheticDemoPdf("pay_stub");
    const text = new TextDecoder().decode(bytes);

    expect(text.startsWith("%PDF-")).toBe(true);
    expect(text).toContain("VIDICY SYNTHETIC PAY STATEMENT");
    expect(text).toContain("Gross monthly pay: $4,200.00");
  });

  it("generates a benefits-letter PDF without embedding an eligibility claim", () => {
    const text = new TextDecoder().decode(buildSyntheticDemoPdf("benefits_letter"));

    expect(text).toContain("VIDICY SYNTHETIC BENEFITS LETTER");
    expect(text).toContain("Monthly benefits: $900.00");
    expect(text.toLowerCase()).not.toContain("eligible");
    expect(text.toLowerCase()).not.toContain("approved");
  });
});
