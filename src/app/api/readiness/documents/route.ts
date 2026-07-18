import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";

import { requireRouteSession, requireSameOriginRequest } from "@/app/api/_utils/request-auth";
import { checkActionRateLimit } from "@/infra/action-rate-limit";
import { logger } from "@/infra/logger";
import {
  getReadinessPdfPageCount,
  MAX_READINESS_PDF_PAGES,
} from "@/features/readiness/document-reader.server";
import {
  DocumentUploadInputError,
  hasValidFileSignature,
  parseDocumentUploadMetadata,
} from "@/features/readiness/contracts";
import { sealBytes } from "@/features/readiness/crypto";
import { extractReadinessDocument } from "@/features/readiness/extract-document.server";
import {
  documentContentContext,
  getReadinessEncryptionSecret,
  insertReadinessDocument,
  markDocumentExtractionFailed,
  markDocumentExtractionProcessing,
  updateDocumentExtraction,
} from "@/features/readiness/server";

function toHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function processUploadedDocument(input: {
  bytes: Uint8Array;
  documentId: string;
  sessionId: string;
  userId: string;
  mimeType: "application/pdf" | "image/jpeg" | "image/png";
  name: string;
}) {
  try {
    await markDocumentExtractionProcessing(input);
    const extraction = await extractReadinessDocument({
      bytes: input.bytes,
      mimeType: input.mimeType,
      name: input.name,
    });
    await updateDocumentExtraction({
      ...input,
      kind: extraction.kind,
      issuedOn: extraction.issuedOn,
      pageCount: extraction.pageCount,
      safetySignalDetected: extraction.safetySignalDetected,
      facts: extraction.facts,
    });
  } catch (error) {
    logger.warn("Readiness document extraction failed", {
      documentId: input.documentId,
      sessionId: input.sessionId,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    await markDocumentExtractionFailed({
      ...input,
      message:
        "Extraction could not complete. You can remove the document or enter facts manually.",
    });
  }
}

export async function POST(request: Request) {
  const originError = requireSameOriginRequest(request);
  if (originError) return originError;

  const routeSession = await requireRouteSession();
  if ("response" in routeSession) return routeSession.response;
  if (!routeSession.session.user.emailVerified) {
    return NextResponse.json(
      { error: "Verify your email before uploading documents." },
      { status: 403 },
    );
  }

  try {
    await checkActionRateLimit("readinessDocumentUpload", routeSession.session.userId, 30);
    const formData = await request.formData();
    const file = formData.get("file");
    const sessionId = formData.get("sessionId");
    if (
      !(file instanceof File) ||
      typeof sessionId !== "string" ||
      !/^rds_[a-z0-9]{3,64}$/u.test(sessionId)
    ) {
      return NextResponse.json(
        { error: "A valid session and document are required." },
        { status: 400 },
      );
    }

    const metadata = parseDocumentUploadMetadata({
      name: file.name,
      type: file.type.trim().toLowerCase(),
      size: file.size,
    });
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!hasValidFileSignature(bytes, metadata.type)) {
      return NextResponse.json(
        { error: "The document contents do not match its declared file type." },
        { status: 400 },
      );
    }

    const pageCount =
      metadata.type === "application/pdf"
        ? await getReadinessPdfPageCount(bytes).catch(() => null)
        : 1;
    if (pageCount !== null && pageCount > MAX_READINESS_PDF_PAGES) {
      return NextResponse.json(
        { error: `PDFs can contain at most ${MAX_READINESS_PDF_PAGES} pages.` },
        { status: 400 },
      );
    }

    const { env, ctx } = await getCloudflareContext({ async: true });
    if (!env.R2) {
      return NextResponse.json({ error: "Document storage is unavailable." }, { status: 503 });
    }

    const documentId = `rdd_${crypto.randomUUID().replaceAll("-", "")}`;
    const r2Key = `readiness/${routeSession.session.userId}/${sessionId}/${documentId}.${metadata.extension}.rd1`;
    const encryptedBytes = await sealBytes(bytes, {
      secret: getReadinessEncryptionSecret(),
      context: documentContentContext(sessionId, documentId),
    });
    const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));

    await env.R2.put(r2Key, encryptedBytes, {
      httpMetadata: { contentType: "application/octet-stream" },
      customMetadata: { sessionId, documentId, encrypted: "aes-256-gcm" },
    });

    try {
      await insertReadinessDocument({
        id: documentId,
        sessionId,
        userId: routeSession.session.userId,
        r2Key,
        mimeType: metadata.type,
        sizeBytes: metadata.size,
        sha256: toHex(digest),
        name: metadata.name,
        pageCount,
      });
    } catch (error) {
      await env.R2.delete(r2Key);
      throw error;
    }

    ctx.waitUntil(
      processUploadedDocument({
        bytes,
        documentId,
        sessionId,
        userId: routeSession.session.userId,
        mimeType: metadata.type,
        name: metadata.name,
      }),
    );

    return NextResponse.json(
      { success: true, documentId, status: "processing" },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    logger.error("Readiness upload failed", {
      userId: routeSession.session.userId,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    if (error instanceof DocumentUploadInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Document upload failed. Please try again." },
      { status: 500 },
    );
  }
}
