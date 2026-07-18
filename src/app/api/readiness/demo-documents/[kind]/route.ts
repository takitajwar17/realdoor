import { NextResponse } from "next/server";

import { requireRouteSession } from "@/app/api/_utils/request-auth";
import {
  buildSyntheticDemoPdf,
  type SyntheticDocumentKind,
} from "@/features/readiness/demo-documents";

const fileNames: Record<SyntheticDocumentKind, string> = {
  pay_stub: "vidicy-synthetic-pay-statement.pdf",
  benefits_letter: "vidicy-synthetic-benefits-letter.pdf",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ kind: string }> },
) {
  const routeSession = await requireRouteSession();
  if ("response" in routeSession) return routeSession.response;

  const { kind } = await params;
  if (kind !== "pay_stub" && kind !== "benefits_letter") {
    return NextResponse.json({ error: "Demo document not found" }, { status: 404 });
  }

  return new Response(buildSyntheticDemoPdf(kind), {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${fileNames[kind]}"`,
      "Content-Type": "application/pdf",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
