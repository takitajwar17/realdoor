import { describe, expect, it } from "vitest";

import { selectClearFactsForConfirmation } from "./bulk-confirmation";

describe("bulk fact confirmation", () => {
  it("selects one strongest clear reading per field", () => {
    const facts = [
      { id: "gross-low", key: "gross_pay", status: "extracted", confidence: 910 },
      { id: "gross-best", key: "gross_pay", status: "extracted", confidence: 980 },
      { id: "net-conflict", key: "net_pay", status: "extracted", confidence: 990 },
      { id: "hours-uncertain", key: "weekly_hours", status: "extracted", confidence: 899 },
      { id: "date-confirmed", key: "pay_date", status: "confirmed", confidence: 990 },
      { id: "frequency", key: "pay_frequency", status: "extracted", confidence: 900 },
    ];

    expect(selectClearFactsForConfirmation(facts, ["net_pay"]).map((fact) => fact.id)).toEqual([
      "gross-best",
      "frequency",
    ]);
  });
});
