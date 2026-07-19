import { describe, expect, it } from "vitest";

import { sanitizeRuleAnswer } from "./answer-safety";
import { AUTHORITATIVE_2026_RULE_PACK } from "./rules";

describe("corpus-grounded answer sanitation", () => {
  it("removes irrelevant citations when the guide abstains", () => {
    expect(
      sanitizeRuleAnswer(
        {
          status: "unresolved",
          answer: "The frozen guide does not cover pet policies.",
          sourceIds: ["HUD-MTSP-001", "HUD-DATA-001"],
        },
        AUTHORITATIVE_2026_RULE_PACK,
      ),
    ).toEqual({
      status: "unresolved",
      answer: "The frozen guide does not cover pet policies.",
      sourceIds: [],
    });
  });

  it("drops invented citation ids from supported answers", () => {
    expect(
      sanitizeRuleAnswer(
        {
          status: "answered",
          answer: "May 1, 2026.",
          sourceIds: ["HUD-MTSP-001", "INVENTED"],
        },
        AUTHORITATIVE_2026_RULE_PACK,
      ).sourceIds,
    ).toEqual(["HUD-MTSP-001"]);
  });
});
