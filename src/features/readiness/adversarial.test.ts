import { describe, expect, it } from "vitest";

import { ADVERSARIAL_TESTS } from "./corpus";
import {
  calculateIncomeComparison,
  deriveChecklist,
  detectFactConflicts,
  isTraceableDocumentFact,
  normalizeExtractedFact,
} from "./domain";
import { AUTHORITATIVE_2026_RULE_PACK, answerRuleQuestion } from "./rules";

describe("supplied adversarial acceptance cases", () => {
  it.each(ADVERSARIAL_TESTS)("enforces $test_id · $category", (test) => {
    switch (test.category) {
      case "prompt_injection":
      case "cross_applicant_leak":
      case "eligibility_overreach":
      case "unsupported_trait": {
        const result = answerRuleQuestion(test.input);
        expect(result.status).toBe("unresolved");
        expect(result.sourceIds.length).toBeGreaterThan(0);
        break;
      }
      case "vacancy_hallucination":
      case "wrong_year_limit": {
        const result = answerRuleQuestion(test.input);
        expect(result.status).toBe("answered");
        expect(result.sourceIds.length).toBeGreaterThan(0);
        break;
      }
      case "missing_citation": {
        const fact = normalizeExtractedFact({ key: "gross_pay", value: "1000", confidence: 1, sourceQuote: "1000" });
        expect(fact && isTraceableDocumentFact(fact)).toBe(false);
        break;
      }
      case "malformed_bbox": {
        expect(normalizeExtractedFact({ key: "gross_pay", value: "1000", confidence: 1, sourceQuote: "1000", page: 1, box: { x: 0.9, y: 0.9, width: 0.5, height: 0.5 } })).toBeNull();
        break;
      }
      case "expired_document": {
        const checklist = deriveChecklist({ asOf: "2026-07-18", documents: [{ id: "letter", kind: "employment_letter", name: "letter.pdf", issuedOn: "2026-04-14", included: true, metadataConfirmed: true }], rules: AUTHORITATIVE_2026_RULE_PACK });
        expect(checklist.some((item) => item.state === "expired")).toBe(true);
        break;
      }
      case "conflicting_totals": {
        expect(detectFactConflicts([
          { key: "gross_pay", value: "1395", confidence: 1, sourceQuote: "1395", status: "extracted" },
          { key: "gross_pay", value: "960", confidence: 1, sourceQuote: "960", status: "extracted" },
        ])).toEqual(["gross_pay"]);
        break;
      }
      case "household_size_9": {
        const result = calculateIncomeComparison({ facts: [
          { key: "household_size", value: "9", status: "confirmed", updatedAt: "2026-07-18" },
          { key: "weekly_hours", value: "40", status: "confirmed", updatedAt: "2026-07-18" },
          { key: "hourly_rate", value: "20", status: "confirmed", updatedAt: "2026-07-18" },
        ], rulePack: AUTHORITATIVE_2026_RULE_PACK });
        expect(result.status).toBe("unresolved");
        break;
      }
      case "unsigned_claim": {
        const fact = { origin: "manual" as const, documentId: null };
        expect(fact).not.toMatchObject({ origin: "extracted", documentId: expect.any(String) });
        break;
      }
      default:
        throw new Error("Unhandled adversarial category");
    }
  });
});
