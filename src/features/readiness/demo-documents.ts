import { DOCUMENT_GOLD, DOCUMENT_MANIFEST } from "./corpus";
import { GENERATED_READINESS_CORPUS } from "./corpus.generated";

function decodeBase64(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function getDemoDocument(fileName: string) {
  const manifest = DOCUMENT_MANIFEST.find((document) => document.file_name === fileName);
  const gold = DOCUMENT_GOLD.find((document) => document.fileName === fileName);
  const encoded = GENERATED_READINESS_CORPUS.documentBytes[
    fileName as keyof typeof GENERATED_READINESS_CORPUS.documentBytes
  ];
  if (!manifest || !gold || !encoded) return null;

  return {
    documentId: manifest.document_id,
    householdId: manifest.household_id,
    documentType: manifest.document_type,
    fileName,
    containsAdversarialText: gold.containsAdversarialText,
    bytes: decodeBase64(encoded),
  };
}

export function listDemoDocuments(householdId?: string) {
  return DOCUMENT_MANIFEST.filter(
    (document) => !householdId || document.household_id === householdId,
  );
}
