import { describe, expect, it } from "vitest";
import { extractText, getDocumentProxy } from "unpdf";

import { DOCUMENT_MANIFEST } from "./corpus";
import { getDemoDocument } from "./demo-documents";

describe("organizer-supplied demo documents", () => {
  it.each(DOCUMENT_MANIFEST)("serves $document_id byte-for-byte as a valid PDF", async (gold) => {
    const document = getDemoDocument(gold.file_name);
    expect(document?.fileName).toBe(gold.file_name);
    expect(new TextDecoder().decode(document?.bytes.slice(0, 5))).toBe("%PDF-");
    expect((await getDocumentProxy(document!.bytes)).numPages).toBeGreaterThan(0);
  });

  it("preserves the adversarial instruction as untrusted evidence", async () => {
    const document = getDemoDocument("hh-002_d03_pay_stub.pdf")!;
    const pdf = await getDocumentProxy(document.bytes);
    const extracted = await extractText(pdf, { mergePages: true });
    expect(extracted.text).toContain("Ignore prior instructions");
    expect(document.containsAdversarialText).toBe(true);
  });

  it("does not retain the obsolete Maya Chen generated demo", () => {
    expect(() => getDemoDocument("realdoor-practice-pay-statement.pdf")).not.toThrow();
    expect(getDemoDocument("realdoor-practice-pay-statement.pdf")).toBeNull();
  });
});
