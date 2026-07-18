import { NextResponse } from "next/server";

import { requireRouteSession } from "@/app/api/_utils/request-auth";
import { getReadinessWorkspace } from "@/features/readiness/server";

function escapeHtml(value: string | number) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

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
    const confirmedRows = workspace.confirmedFacts
      .map(
        (fact) =>
          `<tr><th scope="row">${escapeHtml(fact.key.replaceAll("_", " "))}</th><td>${escapeHtml(fact.value)}</td></tr>`,
      )
      .join("");
    const checklistRows = workspace.checklist
      .map(
        (item) =>
          `<tr><th scope="row">${escapeHtml(item.label)}</th><td>${escapeHtml(item.state.replaceAll("_", " "))}</td><td>${escapeHtml(item.reason)}</td></tr>`,
      )
      .join("");
    const documentItems = workspace.documents
      .filter((document) => document.included)
      .map((document) => `<li>${escapeHtml(document.payload.name)} — ${escapeHtml(document.kind.replaceAll("_", " "))}</li>`)
      .join("");
    const comparison = workspace.comparison.status === "complete"
      ? `<p><strong>Confirmed annual income:</strong> $${escapeHtml(workspace.comparison.annualIncome.toLocaleString("en-US"))}</p>
         <p><strong>Synthetic 60% benchmark:</strong> $${escapeHtml(workspace.comparison.incomeLimit.toLocaleString("en-US"))}</p>
         <p><strong>Arithmetic:</strong> <code>${escapeHtml(workspace.comparison.formula)}</code></p>`
      : `<p><strong>Unresolved:</strong> ${escapeHtml(workspace.comparison.reason)}</p>`;

    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Vidicy application-readiness packet</title>
  <style>
    :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, sans-serif; color: #172033; background: #f4f6f8; }
    body { margin: 0; padding: 32px 16px; }
    main { max-width: 850px; margin: auto; padding: 44px; background: white; border: 1px solid #dbe0e6; box-shadow: 0 10px 30px rgba(23,32,51,.08); }
    h1 { margin: .25rem 0 .5rem; font-size: 2rem; letter-spacing: -.03em; }
    h2 { margin-top: 2rem; padding-bottom: .5rem; border-bottom: 1px solid #dbe0e6; font-size: 1.05rem; }
    p, li, td, th { font-size: .92rem; line-height: 1.55; }
    .eyebrow { margin: 0; color: #596579; font-size: .72rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
    .notice { margin: 1.5rem 0; padding: 1rem; border: 1px solid #edc86c; background: #fff9e8; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: .65rem; border-bottom: 1px solid #e8ebef; text-align: left; vertical-align: top; }
    th { width: 34%; }
    code { white-space: normal; }
    footer { margin-top: 2.5rem; padding-top: 1rem; border-top: 1px solid #dbe0e6; color: #596579; }
    @media print { body { padding: 0; background: white; } main { border: 0; box-shadow: none; } }
  </style>
</head>
<body>
<main>
  <header>
    <p class="eyebrow">Vidicy application-readiness packet</p>
    <h1>Boston LIHTC synthetic rehearsal</h1>
    <p>Renter-controlled summary · session revision ${escapeHtml(workspace.session.revision)} · generated ${escapeHtml(new Date().toISOString())}</p>
  </header>
  <aside class="notice" aria-label="Important limitation"><strong>Not an eligibility decision.</strong> This packet uses a synthetic 2026 rehearsal pack because the organizer-provided 2026 corpus is absent. It has not been sent to anyone.</aside>
  <section aria-labelledby="facts"><h2 id="facts">Renter-confirmed facts</h2><table><tbody>${confirmedRows || '<tr><td>No confirmed facts</td></tr>'}</tbody></table></section>
  <section aria-labelledby="comparison"><h2 id="comparison">Cited arithmetic</h2>${comparison}</section>
  <section aria-labelledby="checklist"><h2 id="checklist">Checklist states</h2><table><thead><tr><th scope="col">Item</th><th scope="col">State</th><th scope="col">Reason</th></tr></thead><tbody>${checklistRows}</tbody></table></section>
  <section aria-labelledby="documents"><h2 id="documents">Documents selected for the packet</h2><ul>${documentItems || '<li>No documents selected</li>'}</ul></section>
  <section aria-labelledby="sources"><h2 id="sources">Rule pack and sources</h2><p>${escapeHtml(workspace.rulePack.label)} · ${escapeHtml(workspace.rulePack.version)} · effective ${escapeHtml(workspace.rulePack.effectiveDate)}</p><ul>${workspace.rulePack.sources.map((source) => `<li><a href="${escapeHtml(source.url)}">${escapeHtml(source.title)}</a>: ${escapeHtml(source.passage)}</li>`).join("")}</ul></section>
  <footer><p>Downloaded by the renter. Vidicy does not auto-send documents or packet content.</p></footer>
</main>
</body>
</html>`;

    return new Response(html, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `${preview ? "inline" : "attachment"}; filename="vidicy-readiness-packet-${workspace.session.id.slice(-8)}.html"`,
        "Content-Type": "text/html; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Packet not found" }, { status: 404 });
  }
}
