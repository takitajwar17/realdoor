export type PacketModel = {
  sessionId: string;
  revision: number;
  generatedAt: string;
  metro: string;
  program: string;
  asOfDate: string;
  timezone: string;
  ruleVersion: string;
  ruleEffectiveDate: string;
  facts: Array<{
    label: string;
    value: string;
    source: string;
    sourceQuote: string | null;
    page: number | null;
  }>;
  worksheet: {
    status: "complete" | "unresolved";
    formula?: string;
    annualIncome?: number;
    incomeLimit?: number;
    difference?: number;
    reason?: string;
  };
  checklist: Array<{
    label: string;
    state: string;
    reason: string;
    sourceId: string;
  }>;
  documents: Array<{ name: string; kind: string; issuedOn: string | null }>;
  questions: Array<{ question: string; answer: string; sourceIds: string[] }>;
  sources: Array<{
    id: string;
    title: string;
    url: string;
    passage: string;
    locator?: string;
  }>;
};

function escapeHtml(value: string | number) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function renderReadinessPacket(model: PacketModel) {
  const facts = model.facts
    .map(
      (fact) =>
        `<tr><th scope="row">${escapeHtml(fact.label)}</th><td>${escapeHtml(fact.value)}</td><td>${escapeHtml(fact.source)}${fact.page ? `, page ${fact.page}` : ""}${fact.sourceQuote ? `<br><q>${escapeHtml(fact.sourceQuote)}</q>` : ""}</td></tr>`,
    )
    .join("");
  const worksheet =
    model.worksheet.status === "complete"
      ? `<dl><dt>Annualized gross income</dt><dd>$${escapeHtml(model.worksheet.annualIncome!.toLocaleString("en-US"))}</dd><dt>Frozen 60% threshold</dt><dd>$${escapeHtml(model.worksheet.incomeLimit!.toLocaleString("en-US"))}</dd><dt>Difference</dt><dd>$${escapeHtml(model.worksheet.difference!.toLocaleString("en-US"))}</dd></dl><p><strong>Arithmetic:</strong> <code>${escapeHtml(model.worksheet.formula!)}</code></p>`
      : `<p><strong>Unresolved:</strong> ${escapeHtml(model.worksheet.reason ?? "Confirmed inputs are incomplete.")}</p>`;
  const checklist = model.checklist
    .map(
      (item) =>
        `<tr><th scope="row">${escapeHtml(item.label)}</th><td>${escapeHtml(item.state)}</td><td>${escapeHtml(item.reason)}</td><td>${escapeHtml(item.sourceId)}</td></tr>`,
    )
    .join("");
  const documents = model.documents
    .map(
      (document) =>
        `<li>${escapeHtml(document.name)} — ${escapeHtml(document.kind)} — ${escapeHtml(document.issuedOn ?? "date unresolved")}</li>`,
    )
    .join("");
  const questions = model.questions
    .map(
      (question) =>
        `<li><strong>${escapeHtml(question.question)}</strong><br>${escapeHtml(question.answer)}<br><small>${escapeHtml(question.sourceIds.join(", ") || "No supporting passage — unresolved")}</small></li>`,
    )
    .join("");
  const sources = model.sources
    .map(
      (source) =>
        `<li id="source-${escapeHtml(source.id)}"><a href="${escapeHtml(source.url)}">${escapeHtml(source.id)} — ${escapeHtml(source.title)}</a>${source.locator ? ` · ${escapeHtml(source.locator)}` : ""}<br>${escapeHtml(source.passage)}</li>`,
    )
    .join("");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>RealDoor application-readiness packet</title><style>:root{color-scheme:light;font-family:Inter,ui-sans-serif,system-ui,sans-serif;color:#172033;background:#f4f6f8}body{margin:0;padding:32px 16px}main{max-width:850px;margin:auto;padding:44px;background:#fff;border:1px solid #dbe0e6}h1{margin:.25rem 0 .5rem;font-size:2rem}h2{margin-top:2rem;padding-bottom:.5rem;border-bottom:1px solid #dbe0e6;font-size:1.05rem}p,li,td,th,dt,dd{font-size:.92rem;line-height:1.55}.eyebrow{color:#596579;font-size:.72rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase}.notice{margin:1.5rem 0;padding:1rem;border:1px solid #edc86c;background:#fff9e8}table{width:100%;border-collapse:collapse}th,td{padding:.65rem;border-bottom:1px solid #e8ebef;text-align:left;vertical-align:top}th{width:24%}dt{font-weight:700}dd{margin:0 0 .5rem}footer{margin-top:2.5rem;padding-top:1rem;border-top:1px solid #dbe0e6;color:#596579}@media print{body{padding:0;background:#fff}main{border:0}}</style></head><body><main><header><p class="eyebrow">RealDoor application-readiness packet</p><h1>${escapeHtml(model.metro)}</h1><p>${escapeHtml(model.program)} · Packet v${model.revision} · Generated ${escapeHtml(model.generatedAt)}</p></header><aside class="notice" aria-label="Important limitation"><strong>Not an eligibility decision.</strong> This packet organizes renter-confirmed facts and a frozen numerical comparison. A human makes every program determination. Nothing has been sent.</aside><section aria-labelledby="facts"><h2 id="facts">Selected confirmed facts and evidence</h2><table><thead><tr><th scope="col">Field</th><th scope="col">Value</th><th scope="col">Source</th></tr></thead><tbody>${facts || '<tr><td colspan="3">No confirmed facts</td></tr>'}</tbody></table></section><section aria-labelledby="worksheet"><h2 id="worksheet">Deterministic worksheet</h2>${worksheet}</section><section aria-labelledby="checklist"><h2 id="checklist">Application checklist</h2><p>Frozen as of ${escapeHtml(model.asOfDate)} in ${escapeHtml(model.timezone)}.</p><table><thead><tr><th scope="col">Item</th><th scope="col">State</th><th scope="col">Rule and arithmetic</th><th scope="col">Source</th></tr></thead><tbody>${checklist}</tbody></table></section><section aria-labelledby="documents"><h2 id="documents">Selected evidence index</h2><ul>${documents || "<li>No source documents selected</li>"}</ul></section><section aria-labelledby="questions"><h2 id="questions">Questions and unresolved reviewer items</h2><ul>${questions || "<li>No saved questions</li>"}</ul></section><section aria-labelledby="sources"><h2 id="sources">Frozen rules and pinpoint citations</h2><p>Version ${escapeHtml(model.ruleVersion)} · effective ${escapeHtml(model.ruleEffectiveDate)}</p><ol>${sources}</ol></section><footer><p>Downloaded to you; not sent. You decide whether and how to share this packet.</p><p>Session ${escapeHtml(model.sessionId)}</p></footer></main></body></html>`;
}
