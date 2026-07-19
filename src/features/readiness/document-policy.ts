export type PracticeDocumentMode = "custom" | "sample" | "household";

export type ExistingPracticeDocument = {
  name?: string;
  practiceMode?: PracticeDocumentMode;
  practiceHouseholdId?: string | null;
};

export class DocumentAdditionConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocumentAdditionConflictError";
  }
}

export function getDocumentAdditionConflict(input: {
  documents: ExistingPracticeDocument[];
  practiceMode: PracticeDocumentMode;
  practiceHouseholdId: string | null;
  documentName: string;
}) {
  const householdDocuments = input.documents.filter(
    (document) => document.practiceMode === "household",
  );

  if (input.practiceMode === "household") {
    const existingHouseholdId = householdDocuments[0]?.practiceHouseholdId ?? null;
    const containsOtherDocuments = input.documents.some(
      (document) => document.practiceMode !== "household",
    );
    if (
      containsOtherDocuments ||
      (existingHouseholdId && existingHouseholdId !== input.practiceHouseholdId)
    ) {
      return "This session already contains other documents. Start a new session for a complete practice household, or remove the existing documents first.";
    }
    if (
      householdDocuments.length >= 4 ||
      householdDocuments.some((document) => document.name === input.documentName)
    ) {
      return "This complete practice household is already in the session. Start a new session to try another set, or remove this household first.";
    }
    return null;
  }

  if (householdDocuments.length > 0) {
    return "This session contains a complete practice household. Start a new session to add individual documents, or remove the household documents first.";
  }

  return null;
}
