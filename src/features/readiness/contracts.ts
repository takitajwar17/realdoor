import { z } from "zod";

export const MAX_READINESS_DOCUMENT_BYTES = 10 * 1024 * 1024;

const readinessSessionId = z.string().regex(/^rds_[a-z0-9]{3,64}$/u);
const readinessFactId = z.string().regex(/^rdf_[a-z0-9]{3,64}$/u);
const readinessDocumentId = z.string().regex(/^rdd_[a-z0-9]{3,64}$/u);

export const createSessionSchema = z.object({
  name: z.string().trim().min(1).max(80),
  consent: z.literal(true),
  acknowledgeSampleData: z.literal(true),
});

export const manualFactSchema = z
  .object({
    sessionId: readinessSessionId,
    key: z.enum([
      "household_size",
      "weekly_hours",
      "hourly_rate",
      "gross_pay",
      "monthly_benefit",
      "gross_receipts",
    ]),
    value: z.coerce.number().finite().min(0).max(10_000_000),
  })
  .superRefine((value, context) => {
    if (
      value.key === "household_size" &&
      (!Number.isInteger(value.value) || value.value < 1 || value.value > 8)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["value"],
        message: "Household size must be a whole number from 1 to 8.",
      });
    }
  });

export const confirmFactSchema = z.object({
  sessionId: readinessSessionId,
  factId: readinessFactId,
  value: z.string().trim().min(1).max(200),
});

export const confirmClearFactsSchema = z.object({
  sessionId: readinessSessionId,
});

export const rejectFactSchema = z.object({
  sessionId: readinessSessionId,
  factId: readinessFactId,
});

export const deleteSessionSchema = z.object({
  sessionId: readinessSessionId,
  confirmation: z.literal("DELETE SESSION"),
});

export const updateDocumentSchema = z.object({
  sessionId: readinessSessionId,
  documentId: readinessDocumentId,
  included: z.boolean(),
});

export const documentMetadataSchema = z.object({
  sessionId: readinessSessionId,
  documentId: readinessDocumentId,
  kind: z.enum([
    "application_summary",
    "pay_stub",
    "employment_letter",
    "benefit_letter",
    "gig_statement",
    "gig_income_corroboration",
    "other",
  ]),
  issuedOn: z.union([z.literal(""), z.string().date()]).transform((value) => value || null),
});

export const removeDocumentSchema = z.object({
  sessionId: readinessSessionId,
  documentId: readinessDocumentId,
});

export const ruleQuestionSchema = z.object({
  sessionId: readinessSessionId,
  question: z.string().trim().min(3).max(1000),
});

const mediaTypes = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
} as const;

export type ReadinessMediaType = keyof typeof mediaTypes;

export class DocumentUploadInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocumentUploadInputError";
  }
}

export function parseDocumentUploadMetadata(input: { name: string; type: string; size: number }) {
  if (!(input.type in mediaTypes)) {
    throw new DocumentUploadInputError("Upload a PDF, JPEG, or PNG document.");
  }

  if (!Number.isSafeInteger(input.size) || input.size <= 0) {
    throw new DocumentUploadInputError("The selected document is empty or invalid.");
  }

  if (input.size > MAX_READINESS_DOCUMENT_BYTES) {
    throw new DocumentUploadInputError("Each document must be 10 MB or smaller.");
  }

  const baseName = input.name.split(/[\\/]/u).at(-1)?.trim() || "document";

  return {
    name: baseName.slice(0, 255),
    type: input.type as ReadinessMediaType,
    extension: mediaTypes[input.type as ReadinessMediaType],
    size: input.size,
  };
}

export function hasValidFileSignature(bytes: Uint8Array, type: ReadinessMediaType) {
  if (type === "application/pdf") {
    return new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-";
  }

  if (type === "image/png") {
    return (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }

  return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}
