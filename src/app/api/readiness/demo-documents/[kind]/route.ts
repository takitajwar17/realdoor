import { NextResponse } from "next/server";

import { requireRouteSession } from "@/app/api/_utils/request-auth";
import {
  buildSyntheticDemoPdf,
  type SyntheticDocumentKind,
} from "@/features/readiness/demo-documents";

const fileNames: Record<SyntheticDocumentKind, string> = {
  pay_stub: "realdoor-practice-pay-statement.pdf",
  benefits_letter: "realdoor-practice-benefits-letter.pdf",
};

export async function GET(request: Request, { params }: { params: Promise<{ kind: string }> }) {
  const routeSession = await requireRouteSession();
  if ("response" in routeSession) return routeSession.response;

  const { kind } = await params;
  if (kind !== "pay_stub" && kind !== "benefits_letter") {
    return NextResponse.json({ error: "Demo document not found" }, { status: 404 });
  }

  const logoResponse = await fetch(
    new URL("/logo/light/transparent_logo_text_horizontal_nobuffer.png", request.url),
  );
  if (!logoResponse.ok) {
    return NextResponse.json({ error: "Brand asset unavailable" }, { status: 503 });
  }

  const logoBytes = new Uint8Array(await logoResponse.arrayBuffer());
  const pdf = await buildSyntheticDemoPdf(kind, logoBytes);
  const body = pdf.slice().buffer as ArrayBuffer;

  return new Response(body, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${fileNames[kind]}"`,
      "Content-Type": "application/pdf",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
