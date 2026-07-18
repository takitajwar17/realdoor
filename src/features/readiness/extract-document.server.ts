import "server-only";

import { z } from "zod";

import { DOCUMENT_KIND } from "@/db/schema";
import { getOpenAIClient } from "@/lib/openai";

import { FACT_KEYS, normalizeExtractedFact } from "./domain";
import { getReadinessPdfPageCount, readReadinessDocumentText } from "./document-reader.server";
import {
  buildExtractionPrompt,
  extractFactsFromSyntheticText,
  type ExtractionResult,
} from "./extraction";

const aiExtractionSchema = z.object({
  kind: z.enum([
    DOCUMENT_KIND.PAY_STUB,
    DOCUMENT_KIND.BENEFITS_LETTER,
    DOCUMENT_KIND.PHOTO_ID,
    DOCUMENT_KIND.BANK_STATEMENT,
    DOCUMENT_KIND.OTHER,
  ]),
  issuedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u).nullable(),
  facts: z
    .array(
      z.object({
        key: z.enum(FACT_KEYS),
        value: z.string().min(1).max(500),
        confidence: z.number().min(0).max(1),
        sourceQuote: z.string().min(1).max(1000),
        page: z.number().int().min(1).nullable().optional(),
      }),
    )
    .max(40),
});

function stripMarkdownFence(value: string) {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/iu, "")
    .replace(/\s*```$/u, "");
}

function isValidIsoDate(value: string | null) {
  if (!value) return true;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

async function extractWithFrozenAllowlist(text: string): Promise<ExtractionResult> {
  const response = await getOpenAIClient().responses.create(
    {
      model: "gpt-4.1-mini",
      input: buildExtractionPrompt(text),
      max_output_tokens: 2_000,
    },
    { signal: AbortSignal.timeout(30_000) },
  );

  const parsed = aiExtractionSchema.parse(JSON.parse(stripMarkdownFence(response.output_text)));
  if (!isValidIsoDate(parsed.issuedOn)) {
    throw new Error("The extracted document date is invalid");
  }

  const facts: ExtractionResult["facts"] = [];
  for (const candidate of parsed.facts) {
    // A model-provided source must be present in the untrusted document. This
    // prevents an invented citation from entering the renter confirmation UI.
    if (!text.includes(candidate.sourceQuote)) continue;

    const normalized = normalizeExtractedFact({
      ...candidate,
      page: candidate.page ?? undefined,
    });
    if (!normalized) continue;

    facts.push({
      key: normalized.key,
      value: normalized.value,
      confidence: normalized.confidence,
      sourceQuote: normalized.sourceQuote,
      page: normalized.page ?? null,
      box: null,
    });
  }

  return {
    kind: parsed.kind,
    issuedOn: parsed.issuedOn,
    facts,
  };
}

export async function extractReadinessDocument(input: {
  bytes: Uint8Array;
  mimeType: "application/pdf" | "image/jpeg" | "image/png";
  name: string;
}) {
  const pageCount =
    input.mimeType === "application/pdf"
      ? await getReadinessPdfPageCount(input.bytes).catch(() => null)
      : 1;
  const documentText = await readReadinessDocumentText(input);

  if (!documentText.trim()) {
    throw new Error("No readable text was found in this document");
  }

  const text = documentText.slice(0, 60_000);
  const extraction = text.includes("VIDICY SYNTHETIC")
    ? extractFactsFromSyntheticText(text)
    : await extractWithFrozenAllowlist(text);

  return { ...extraction, pageCount };
}
