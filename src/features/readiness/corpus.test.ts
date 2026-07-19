import { describe, expect, it } from "vitest";

import {
  APPLICATION_CHECKLISTS,
  CORPUS_AS_OF,
  DOCUMENT_GOLD,
  FROZEN_RULES,
  MTSP_LIMITS_2026,
  QA_GOLD,
} from "./corpus";

describe("authoritative readiness corpus", () => {
  it("loads every supplied evaluation surface", () => {
    expect(DOCUMENT_GOLD).toHaveLength(24);
    expect(APPLICATION_CHECKLISTS).toHaveLength(6);
    expect(QA_GOLD).toHaveLength(36);
    expect(FROZEN_RULES).toHaveLength(11);
  });

  it("publishes the exact frozen 2026 Boston limits", () => {
    expect(CORPUS_AS_OF).toEqual({ date: "2026-07-18", timezone: "America/New_York" });
    expect(MTSP_LIMITS_2026.map((row) => row.incomeLimit60Percent)).toEqual([
      72_000, 82_320, 92_580, 102_840, 111_120, 119_340, 127_560, 135_780,
    ]);
    expect(new Set(MTSP_LIMITS_2026.map((row) => row.sourcePdfPage))).toEqual(new Set([130]));
    expect(new Set(MTSP_LIMITS_2026.map((row) => row.effectiveDate))).toEqual(
      new Set(["2026-05-01"]),
    );
  });

  it("keeps every extracted gold value attached to an exact PDF box", () => {
    for (const document of DOCUMENT_GOLD) {
      expect(document.fields.length).toBeGreaterThan(0);
      for (const field of document.fields) {
        expect(field.page).toBeGreaterThan(0);
        expect(field.bbox).toHaveLength(4);
        expect(field.bboxUnits).toBe("pdf_points_bottom_left_origin");
      }
    }
  });
});
