import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";

import { requireRouteSession } from "@/app/api/_utils/request-auth";
import { openEncryptedBytes } from "@/features/readiness/crypto";
import {
  documentContentContext,
  getOwnedDocument,
  getReadinessEncryptionSecret,
} from "@/features/readiness/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const routeSession = await requireRouteSession();
  if ("response" in routeSession) return routeSession.response;

  const { documentId } = await params;
  const sessionId = new URL(request.url).searchParams.get("sessionId");
  if (!sessionId || !/^rds_[a-z0-9]{3,64}$/u.test(sessionId)) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  try {
    const document = await getOwnedDocument({
      sessionId,
      documentId,
      userId: routeSession.session.userId,
    });
    const { env } = await getCloudflareContext({ async: true });
    const stored = await env.R2?.get(document.r2Key);
    if (!stored) return NextResponse.json({ error: "Document not found" }, { status: 404 });

    const encrypted = new Uint8Array(await stored.arrayBuffer());
    const bytes = await openEncryptedBytes(encrypted, {
      secret: getReadinessEncryptionSecret(),
      context: documentContentContext(sessionId, documentId),
    });
    const encodedName = encodeURIComponent(document.payload.name);

    return new Response(bytes, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `inline; filename="document"; filename*=UTF-8''${encodedName}`,
        "Content-Length": String(bytes.byteLength),
        "Content-Type": document.mimeType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
}
