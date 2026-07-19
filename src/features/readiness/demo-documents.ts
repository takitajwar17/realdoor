import {
  PDFDocument,
  type PDFImage,
  type PDFFont,
  type PDFPage,
  StandardFonts,
  rgb,
} from "pdf-lib";

export type SyntheticDocumentKind = "pay_stub" | "benefits_letter";

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;

const color = {
  ink: rgb(18 / 255, 27 / 255, 39 / 255),
  muted: rgb(99 / 255, 111 / 255, 108 / 255),
  line: rgb(218 / 255, 224 / 255, 220 / 255),
  paper: rgb(248 / 255, 249 / 255, 247 / 255),
  panel: rgb(1, 1, 1),
  brand: rgb(32 / 255, 48 / 255, 44 / 255),
  brandSoft: rgb(235 / 255, 240 / 255, 236 / 255),
  accent: rgb(207 / 255, 134 / 255, 34 / 255),
  accentSoft: rgb(253 / 255, 246 / 255, 231 / 255),
  white: rgb(1, 1, 1),
};

type Fonts = {
  regular: PDFFont;
  bold: PDFFont;
};

type BrandAssets = {
  logo: PDFImage;
};

type DocumentDefinition = {
  title: string;
  machineTitle: string;
  reference: string;
  issuedOn: string;
  partyLabel: string;
  partyName: string;
  address: string;
  detailLabel: string;
  detailValue: string;
  amountLabel: string;
  amountValue: string;
  summary: string;
};

const documents: Record<SyntheticDocumentKind, DocumentDefinition> = {
  pay_stub: {
    title: "Pay statement",
    machineTitle: "REALDOOR PRACTICE PAY STATEMENT",
    reference: "RD-PAY-2026-0701",
    issuedOn: "2026-07-01",
    partyLabel: "Employee",
    partyName: "Maya Chen",
    address: "18 Beacon Street, Boston, MA 02108",
    detailLabel: "Employer",
    detailValue: "Harbor Street Market",
    amountLabel: "Gross monthly pay",
    amountValue: "$4,200.00",
    summary: "Monthly earnings summary",
  },
  benefits_letter: {
    title: "Benefits verification letter",
    machineTitle: "REALDOOR PRACTICE BENEFITS LETTER",
    reference: "RD-BEN-2026-0615",
    issuedOn: "2026-06-15",
    partyLabel: "Recipient",
    partyName: "Maya Chen",
    address: "18 Beacon Street, Boston, MA 02108",
    detailLabel: "Benefit type",
    detailValue: "Supplemental income",
    amountLabel: "Monthly benefits",
    amountValue: "$900.00",
    summary: "Monthly benefit summary",
  },
};

function drawHeader(
  page: PDFPage,
  fonts: Fonts,
  assets: BrandAssets,
  definition: DocumentDefinition,
) {
  page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: color.paper });
  page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 104, width: PAGE_WIDTH, height: 104, color: color.brand });
  page.drawRectangle({ x: 0, y: 0, width: 12, height: PAGE_HEIGHT, color: color.brand });

  const logoSize = assets.logo.scaleToFit(132, 36);
  page.drawImage(assets.logo, {
    x: 42,
    y: 722,
    width: logoSize.width,
    height: logoSize.height,
  });
  page.drawText("APPLICATION READINESS", {
    x: 42,
    y: 710,
    size: 7,
    font: fonts.regular,
    color: rgb(205 / 255, 216 / 255, 211 / 255),
  });

  page.drawText("PRACTICE DOCUMENT", {
    x: 436,
    y: 738,
    size: 7.5,
    font: fonts.bold,
    color: color.white,
  });
  page.drawText(definition.reference, {
    x: 468,
    y: 718,
    size: 7.5,
    font: fonts.regular,
    color: rgb(205 / 255, 216 / 255, 211 / 255),
  });
}

function drawField(
  page: PDFPage,
  fonts: Fonts,
  input: { x: number; y: number; label: string; value: string; width?: number },
) {
  page.drawText(`${input.label.toUpperCase()}:`, {
    x: input.x,
    y: input.y,
    size: 7,
    font: fonts.bold,
    color: color.muted,
  });
  page.drawText(input.value, {
    x: input.x,
    y: input.y - 20,
    size: 11,
    font: fonts.bold,
    color: color.ink,
    maxWidth: input.width ?? 220,
  });
}

function drawSectionLabel(page: PDFPage, fonts: Fonts, text: string, y: number) {
  page.drawText(text.toUpperCase(), {
    x: 42,
    y,
    size: 7.5,
    font: fonts.bold,
    color: color.muted,
  });
  page.drawLine({
    start: { x: 42, y: y - 9 },
    end: { x: 570, y: y - 9 },
    thickness: 0.75,
    color: color.line,
  });
}

function drawDocument(
  page: PDFPage,
  fonts: Fonts,
  assets: BrandAssets,
  definition: DocumentDefinition,
) {
  drawHeader(page, fonts, assets, definition);

  page.drawText(definition.machineTitle, {
    x: 42,
    y: 654,
    size: 7,
    font: fonts.bold,
    color: color.muted,
  });
  page.drawText(definition.title, {
    x: 42,
    y: 615,
    size: 27,
    font: fonts.bold,
    color: color.ink,
  });
  page.drawText("Verified practice record for a guided application-readiness session.", {
    x: 42,
    y: 591,
    size: 10.5,
    font: fonts.regular,
    color: color.muted,
  });

  page.drawRectangle({
    x: 42,
    y: 528,
    width: 528,
    height: 44,
    color: color.accentSoft,
    borderColor: rgb(238 / 255, 210 / 255, 157 / 255),
    borderWidth: 0.8,
  });
  page.drawRectangle({ x: 42, y: 528, width: 4, height: 44, color: color.accent });
  page.drawText("FOR GUIDED PRACTICE ONLY", {
    x: 59,
    y: 552,
    size: 7.5,
    font: fonts.bold,
    color: rgb(138 / 255, 87 / 255, 20 / 255),
  });
  page.drawText("Not an official verification and not intended for submission.", {
    x: 59,
    y: 536,
    size: 9,
    font: fonts.regular,
    color: color.ink,
  });

  drawSectionLabel(page, fonts, "Record details", 497);
  drawField(page, fonts, {
    x: 42,
    y: 463,
    label: definition.partyLabel,
    value: definition.partyName,
  });
  drawField(page, fonts, {
    x: 318,
    y: 463,
    label: "Document date",
    value: definition.issuedOn,
  });
  drawField(page, fonts, {
    x: 42,
    y: 403,
    label: "Current address",
    value: definition.address,
    width: 480,
  });
  drawField(page, fonts, {
    x: 42,
    y: 343,
    label: definition.detailLabel,
    value: definition.detailValue,
  });
  if (definition.machineTitle.includes("PAY STATEMENT")) {
    drawField(page, fonts, {
      x: 318,
      y: 343,
      label: "Pay frequency",
      value: "Monthly",
    });
  }

  drawSectionLabel(page, fonts, definition.summary, 280);
  page.drawRectangle({
    x: 42,
    y: 170,
    width: 528,
    height: 81,
    color: color.panel,
    borderColor: color.line,
    borderWidth: 0.9,
  });
  page.drawRectangle({ x: 42, y: 170, width: 8, height: 81, color: color.brand });
  page.drawText(`${definition.amountLabel.toUpperCase()}:`, {
    x: 67,
    y: 224,
    size: 7.5,
    font: fonts.bold,
    color: color.muted,
  });
  page.drawText(definition.amountValue, {
    x: 67,
    y: 189,
    size: 25,
    font: fonts.bold,
    color: color.ink,
  });
  page.drawText("CONFIRM IN REALDOOR", {
    x: 422,
    y: 201,
    size: 7,
    font: fonts.bold,
    color: color.brand,
  });

  page.drawRectangle({ x: 42, y: 97, width: 528, height: 48, color: color.brandSoft });
  page.drawText("DOCUMENT CONTROL", {
    x: 58,
    y: 126,
    size: 7,
    font: fonts.bold,
    color: color.brand,
  });
  page.drawText("Review every value against this source before confirming it in RealDoor.", {
    x: 58,
    y: 109,
    size: 8.5,
    font: fonts.regular,
    color: color.ink,
  });

  page.drawLine({
    start: { x: 42, y: 65 },
    end: { x: 570, y: 65 },
    thickness: 0.75,
    color: color.line,
  });
  page.drawText(`Reference ${definition.reference} | Private practice material`, {
    x: 42,
    y: 45,
    size: 7.5,
    font: fonts.regular,
    color: color.muted,
  });
  page.drawText("1 / 1", {
    x: 548,
    y: 45,
    size: 7.5,
    font: fonts.bold,
    color: color.muted,
  });
}

export async function buildSyntheticDemoPdf(
  kind: SyntheticDocumentKind,
  brandLogoBytes: Uint8Array,
) {
  const definition = documents[kind];
  const pdf = await PDFDocument.create();
  const fonts = {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
  };
  const assets = { logo: await pdf.embedPng(brandLogoBytes) };
  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  pdf.setTitle(`RealDoor ${definition.title}`);
  pdf.setAuthor("RealDoor");
  pdf.setSubject("Synthetic application-readiness practice document");
  pdf.setCreator("RealDoor Application Readiness");
  pdf.setProducer("RealDoor Document System");
  pdf.setCreationDate(new Date(`${definition.issuedOn}T12:00:00.000Z`));
  pdf.setModificationDate(new Date(`${definition.issuedOn}T12:00:00.000Z`));

  drawDocument(page, fonts, assets, definition);
  return pdf.save({ useObjectStreams: false });
}
