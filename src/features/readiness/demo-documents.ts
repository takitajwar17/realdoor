export type SyntheticDocumentKind = "pay_stub" | "benefits_letter";

const DOCUMENT_LINES: Record<SyntheticDocumentKind, string[]> = {
  pay_stub: [
    "VIDICY SYNTHETIC PAY STATEMENT",
    "For product rehearsal only - not an official verification",
    "Employee: Maya Chen",
    "Current address: 18 Beacon Street, Boston, MA 02108",
    "Document date: 2026-07-01",
    "Employer: Harbor Street Market",
    "Pay frequency: Monthly",
    "Gross monthly pay: $4,200.00",
  ],
  benefits_letter: [
    "VIDICY SYNTHETIC BENEFITS LETTER",
    "For product rehearsal only - not an official verification",
    "Recipient: Maya Chen",
    "Current address: 18 Beacon Street, Boston, MA 02108",
    "Document date: 2026-06-15",
    "Benefit type: Supplemental income",
    "Monthly benefits: $900.00",
  ],
};

function escapePdfText(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

function byteLength(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

export function buildSyntheticDemoPdf(kind: SyntheticDocumentKind) {
  const contentLines = DOCUMENT_LINES[kind]
    .map((line, index) => `${index === 0 ? "" : "0 -28 Td\n"}(${escapePdfText(line)}) Tj`)
    .join("\n");
  const stream = `BT\n/F1 13 Tf\n72 738 Td\n${contentLines}\nET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n%1234\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  pdf += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
    .join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new TextEncoder().encode(pdf);
}
