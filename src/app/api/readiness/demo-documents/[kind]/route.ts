import { NextResponse } from "next/server";

import { requireRouteSession } from "@/app/api/_utils/request-auth";
import { getDemoDocument } from "@/features/readiness/demo-documents";

export async function GET(_request: Request, { params }: { params: Promise<{ kind: string }> }) {
  const routeSession = await requireRouteSession();
  if ("response" in routeSession) return routeSession.response;

  const { kind: encodedFileName } = await params;
  const fileName = decodeURIComponent(encodedFileName);
  const document = getDemoDocument(fileName);
  if (!document) {
    return NextResponse.json({ error: "Demo document not found" }, { status: 404 });
  }
  const body = document.bytes.slice().buffer as ArrayBuffer;

  return new Response(body, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${document.fileName}"`,
      "Content-Type": "application/pdf",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
