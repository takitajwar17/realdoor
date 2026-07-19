import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { extractText, getDocumentProxy } from "unpdf";

import { buildSyntheticDemoPdf } from "./demo-documents";
import { extractFactsFromSyntheticText } from "./extraction";

describe("built-in synthetic demo documents", () => {
  const logoBytes = readFile(
    "public/logo/light/transparent_logo_text_horizontal_nobuffer.png",
  );

  it("generates a valid pay-statement PDF with deterministic extraction labels", async () => {
    const bytes = await buildSyntheticDemoPdf("pay_stub", await logoBytes);
    const header = new TextDecoder().decode(bytes.slice(0, 5));
    const pdf = await getDocumentProxy(bytes);
    const extracted = await extractText(pdf, { mergePages: true });

    expect(header).toBe("%PDF-");
    expect(extracted.text).toContain("REALDOOR PRACTICE PAY STATEMENT");
    expect(extracted.text).toContain("GROSS MONTHLY PAY: $4,200.00");
  });

  it("generates a benefits-letter PDF without embedding an eligibility claim", async () => {
    const pdf = await getDocumentProxy(
      await buildSyntheticDemoPdf("benefits_letter", await logoBytes),
    );
    const extracted = await extractText(pdf, { mergePages: true });

    expect(extracted.text).toContain("REALDOOR PRACTICE BENEFITS LETTER");
    expect(extracted.text).toContain("MONTHLY BENEFITS: $900.00");
    expect(extracted.text.toLowerCase()).not.toContain("eligible");
    expect(extracted.text.toLowerCase()).not.toContain("approved");
  });

  it("produces documents that the production PDF reader can parse", async () => {
    const pdf = await getDocumentProxy(await buildSyntheticDemoPdf("pay_stub", await logoBytes));
    const extracted = await extractText(pdf, { mergePages: true });
    const result = extractFactsFromSyntheticText(extracted.text);

    expect(pdf.numPages).toBe(1);
    expect(result.issuedOn).toBe("2026-07-01");
    expect(result.facts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "full_name", value: "Maya Chen" }),
        expect.objectContaining({
          key: "employment_monthly_income",
          value: "4200.00",
        }),
      ]),
    );
  });
});
