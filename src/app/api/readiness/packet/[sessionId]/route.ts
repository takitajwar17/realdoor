import { NextResponse } from "next/server";

import { requireRouteSession } from "@/app/api/_utils/request-auth";
import { CORPUS_AS_OF } from "@/features/readiness/corpus";
import { summarizeConfirmedIncome } from "@/features/readiness/domain";
import { renderReadinessPacket, type PacketModel } from "@/features/readiness/packet";
import {
  formatFactValue,
  getDocumentKindLabel,
  getFactLabel,
} from "@/features/readiness/presentation";
import { getReadinessWorkspace, recordPacketDownloaded } from "@/features/readiness/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const auth = await requireRouteSession();
  if ("response" in auth) return auth.response;
  const { sessionId } = await params;

  try {
    const workspace = await getReadinessWorkspace(sessionId, auth.session.userId);
    const preview = new URL(request.url).searchParams.get("mode") === "preview";
    const documentById = new Map(workspace.documents.map((document) => [document.id, document]));
    const income = summarizeConfirmedIncome(workspace.confirmedFacts);
    const comparison = workspace.comparison;
    const model: PacketModel = {
      sessionId: workspace.session.id,
      revision: workspace.session.revision,
      generatedAt: `${workspace.session.updatedAt.toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: CORPUS_AS_OF.timezone,
      })} ${CORPUS_AS_OF.timezone}`,
      metro: workspace.session.metro,
      program: workspace.session.program,
      asOfDate: workspace.session.asOfDate,
      timezone: CORPUS_AS_OF.timezone,
      ruleVersion: workspace.rulePack.version,
      ruleEffectiveDate: workspace.rulePack.effectiveDate,
      facts: workspace.confirmedFacts.map((fact) => {
        const document = fact.documentId ? documentById.get(fact.documentId) : undefined;
        return {
          label: getFactLabel(fact.key),
          value: formatFactValue(fact.key, fact.value),
          source: document?.payload.name ?? "Entered by renter",
          sourceQuote: fact.sourceQuote ?? null,
          page: fact.page ?? null,
        };
      }),
      worksheet:
        comparison.status === "complete"
          ? {
              status: "complete",
              annualIncome: comparison.annualIncome,
              incomeLimit: comparison.incomeLimit,
              difference: comparison.difference,
              formula: `${income.components.map((component) => component.formula).join("; ")}. ${comparison.formula}`,
            }
          : { status: "unresolved", reason: comparison.reason },
      checklist: workspace.checklist.map((item) => ({
        label: item.label,
        state: item.state[0]!.toUpperCase() + item.state.slice(1),
        reason: item.reason,
        sourceId: item.sourceId,
      })),
      documents: workspace.documents
        .filter((document) => document.included)
        .map((document) => ({
          name: document.payload.name,
          kind: getDocumentKindLabel(document.kind),
          issuedOn: document.payload.issuedOn,
        })),
      questions: workspace.questions.map((question) => ({
        question: question.payload.question,
        answer: question.payload.answer,
        sourceIds: JSON.parse(question.sourceIds) as string[],
      })),
      sources: workspace.rulePack.sources.map((source) => ({
        id: source.id,
        title: source.title,
        url: source.url,
        passage: source.passage,
        locator: source.locator,
      })),
    };
    const html = renderReadinessPacket(model);

    if (!preview) await recordPacketDownloaded(sessionId, auth.session.userId);

    return new Response(html, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `${preview ? "inline" : "attachment"}; filename="realdoor-readiness-packet-${workspace.session.id.slice(-8)}.html"`,
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
        "Content-Type": "text/html; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Packet not found" }, { status: 404 });
  }
}
