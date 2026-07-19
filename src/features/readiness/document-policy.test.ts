import { describe, expect, it } from "vitest";

import { getDocumentAdditionConflict } from "./document-policy";

describe("practice document session boundaries", () => {
  it("allows a complete household in an empty session", () => {
    expect(
      getDocumentAdditionConflict({
        documents: [],
        practiceMode: "household",
        practiceHouseholdId: "hh-003",
        documentName: "hh-003_d01_application_summary.pdf",
      }),
    ).toBeNull();
  });

  it("allows the remaining files from the same complete household", () => {
    expect(
      getDocumentAdditionConflict({
        documents: [
          {
            name: "hh-003_d01_application_summary.pdf",
            practiceMode: "household",
            practiceHouseholdId: "hh-003",
          },
        ],
        practiceMode: "household",
        practiceHouseholdId: "hh-003",
        documentName: "hh-003_d02_pay_stub.pdf",
      }),
    ).toBeNull();
  });

  it("blocks a different complete household", () => {
    expect(
      getDocumentAdditionConflict({
        documents: [{ practiceMode: "household", practiceHouseholdId: "hh-003" }],
        practiceMode: "household",
        practiceHouseholdId: "hh-004",
        documentName: "hh-004_d01_application_summary.pdf",
      }),
    ).toContain("already contains other documents");
  });

  it("blocks individual documents after a complete household", () => {
    expect(
      getDocumentAdditionConflict({
        documents: [{ practiceMode: "household", practiceHouseholdId: "hh-003" }],
        practiceMode: "sample",
        practiceHouseholdId: null,
        documentName: "hh-003_d02_pay_stub.pdf",
      }),
    ).toContain("contains a complete practice household");
  });

  it("blocks a complete household after an individual sample", () => {
    expect(
      getDocumentAdditionConflict({
        documents: [{ practiceMode: "sample", practiceHouseholdId: null }],
        practiceMode: "household",
        practiceHouseholdId: "hh-003",
        documentName: "hh-003_d01_application_summary.pdf",
      }),
    ).toContain("already contains other documents");
  });

  it("blocks a duplicate file in the same complete household", () => {
    expect(
      getDocumentAdditionConflict({
        documents: [
          {
            name: "hh-003_d01_application_summary.pdf",
            practiceMode: "household",
            practiceHouseholdId: "hh-003",
          },
        ],
        practiceMode: "household",
        practiceHouseholdId: "hh-003",
        documentName: "hh-003_d01_application_summary.pdf",
      }),
    ).toContain("already in the session");
  });
});
