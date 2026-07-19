import {
  PDFDocument,
  type PDFImage,
  type PDFFont,
  type PDFPage,
  StandardFonts,
  rgb,
} from "pdf-lib";

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

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const CONTENT_LEFT = 42;
const CONTENT_RIGHT = 570;
const CONTENT_WIDTH = CONTENT_RIGHT - CONTENT_LEFT;
const CONTENT_TOP = 670;
const CONTENT_BOTTOM = 68;

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

type Fonts = { regular: PDFFont; bold: PDFFont };

function normalizePdfText(value: string | number) {
  return String(value)
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2212]/gu, "-")
    .replace(/[\u2018\u2019]/gu, "'")
    .replace(/[\u201c\u201d]/gu, '"')
    .replaceAll("→", "to")
    .replaceAll("×", "x")
    .replaceAll("≤", "<=")
    .replaceAll("≥", ">=")
    .replaceAll("·", "|")
    .replace(/[^\x20-\x7E\n]/gu, "");
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const lines: string[] = [];
  for (const paragraph of normalizePdfText(text).split("\n")) {
    const words = paragraph.trim().split(/\s+/u).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }

    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      line = word;
    }
    if (line) lines.push(line);
  }
  return lines;
}

function money(value: number) {
  const absolute = Math.abs(value).toLocaleString("en-US", { maximumFractionDigits: 0 });
  return `${value < 0 ? "-" : ""}$${absolute}`;
}

function valuesMatch(value: string, quote: string) {
  const clean = (input: string) => input.trim().replaceAll("$", "").replaceAll(",", "");
  const left = clean(value);
  const right = clean(quote);
  const leftNumber = Number(left);
  const rightNumber = Number(right);
  if (left && right && Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
    return leftNumber === rightNumber;
  }
  return left.toLocaleLowerCase("en-US") === right.toLocaleLowerCase("en-US");
}

export function preparePacketFactEvidence(input: {
  value: string;
  sourceQuote: string | null;
  documentName: string | null;
}) {
  const corrected = Boolean(input.sourceQuote && !valuesMatch(input.value, input.sourceQuote));
  return {
    source: input.documentName
      ? corrected
        ? `Corrected by renter from ${input.documentName}`
        : input.documentName
      : "Entered by renter",
    sourceQuote: corrected ? null : input.sourceQuote,
  };
}

class PacketRenderer {
  private page!: PDFPage;
  private y = CONTENT_TOP;
  private readonly pages: PDFPage[] = [];
  private readonly pdf: PDFDocument;
  private readonly fonts: Fonts;
  private readonly logo: PDFImage;
  private readonly model: PacketModel;

  constructor(pdf: PDFDocument, fonts: Fonts, logo: PDFImage, model: PacketModel) {
    this.pdf = pdf;
    this.fonts = fonts;
    this.logo = logo;
    this.model = model;
  }

  private addPage() {
    this.page = this.pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.pages.push(this.page);
    this.y = CONTENT_TOP;

    this.page.drawRectangle({
      x: 0,
      y: 0,
      width: PAGE_WIDTH,
      height: PAGE_HEIGHT,
      color: color.paper,
    });
    this.page.drawRectangle({
      x: 0,
      y: PAGE_HEIGHT - 90,
      width: PAGE_WIDTH,
      height: 90,
      color: color.brand,
    });
    this.page.drawRectangle({ x: 0, y: 0, width: 12, height: PAGE_HEIGHT, color: color.brand });

    const logoSize = this.logo.scaleToFit(126, 34);
    this.page.drawImage(this.logo, {
      x: CONTENT_LEFT,
      y: 733,
      width: logoSize.width,
      height: logoSize.height,
    });
    this.page.drawText("APPLICATION READINESS", {
      x: CONTENT_LEFT,
      y: 718,
      size: 7,
      font: this.fonts.regular,
      color: rgb(205 / 255, 216 / 255, 211 / 255),
    });
    this.page.drawText("RENTER-CONTROLLED PACKET", {
      x: 426,
      y: 744,
      size: 7,
      font: this.fonts.bold,
      color: color.white,
    });
    this.page.drawText(`REVISION ${this.model.revision}`, {
      x: 501,
      y: 722,
      size: 7,
      font: this.fonts.regular,
      color: rgb(205 / 255, 216 / 255, 211 / 255),
    });
  }

  private ensureSpace(height: number) {
    if (this.y - height < CONTENT_BOTTOM) this.addPage();
  }

  private drawLines(input: {
    lines: string[];
    x: number;
    y: number;
    size: number;
    lineHeight: number;
    font?: PDFFont;
    textColor?: ReturnType<typeof rgb>;
  }) {
    input.lines.forEach((line, index) => {
      this.page.drawText(line, {
        x: input.x,
        y: input.y - index * input.lineHeight,
        size: input.size,
        font: input.font ?? this.fonts.regular,
        color: input.textColor ?? color.ink,
      });
    });
  }

  private paragraph(
    text: string,
    options: {
      size?: number;
      width?: number;
      lineHeight?: number;
      font?: PDFFont;
      textColor?: ReturnType<typeof rgb>;
      gap?: number;
    } = {},
  ) {
    const size = options.size ?? 9;
    const lineHeight = options.lineHeight ?? size * 1.45;
    const font = options.font ?? this.fonts.regular;
    const lines = wrapText(text, font, size, options.width ?? CONTENT_WIDTH);
    const height = Math.max(lineHeight, lines.length * lineHeight);
    this.ensureSpace(height + (options.gap ?? 6));
    this.drawLines({
      lines,
      x: CONTENT_LEFT,
      y: this.y,
      size,
      lineHeight,
      font,
      textColor: options.textColor,
    });
    this.y -= height + (options.gap ?? 6);
  }

  private sectionTitle(title: string, kicker?: string) {
    // Keep every heading with at least the first row or paragraph that follows it.
    this.ensureSpace(100);
    if (kicker) {
      this.page.drawText(normalizePdfText(kicker).toUpperCase(), {
        x: CONTENT_LEFT,
        y: this.y,
        size: 6.7,
        font: this.fonts.bold,
        color: color.muted,
      });
      this.y -= 16;
    }
    this.page.drawText(normalizePdfText(title), {
      x: CONTENT_LEFT,
      y: this.y,
      size: 16,
      font: this.fonts.bold,
      color: color.ink,
    });
    this.page.drawLine({
      start: { x: CONTENT_LEFT, y: this.y - 10 },
      end: { x: CONTENT_RIGHT, y: this.y - 10 },
      thickness: 0.8,
      color: color.line,
    });
    this.y -= 31;
  }

  private row(input: { label: string; value: string; detail?: string; status?: string }) {
    const labelLines = wrapText(input.label, this.fonts.bold, 8.5, 126);
    const valueLines = wrapText(input.value, this.fonts.bold, 9, 105);
    const detailLines = input.detail
      ? wrapText(input.detail, this.fonts.regular, 8, 244)
      : [];
    const contentLines = Math.max(labelLines.length, valueLines.length, detailLines.length, 1);
    const height = Math.max(44, contentLines * 11 + 20);
    this.ensureSpace(height + 7);

    this.page.drawRectangle({
      x: CONTENT_LEFT,
      y: this.y - height + 8,
      width: CONTENT_WIDTH,
      height,
      color: color.panel,
      borderColor: color.line,
      borderWidth: 0.7,
    });
    this.page.drawRectangle({
      x: CONTENT_LEFT,
      y: this.y - height + 8,
      width: 4,
      height,
      color: input.status?.toLocaleLowerCase("en-US").includes("expired")
        ? color.accent
        : color.brand,
    });
    this.drawLines({
      lines: labelLines,
      x: CONTENT_LEFT + 16,
      y: this.y - 10,
      size: 8.5,
      lineHeight: 11,
      font: this.fonts.bold,
    });
    this.drawLines({
      lines: valueLines,
      x: 188,
      y: this.y - 10,
      size: 9,
      lineHeight: 11,
      font: this.fonts.bold,
      textColor: color.brand,
    });
    if (detailLines.length > 0) {
      this.drawLines({
        lines: detailLines,
        x: 310,
        y: this.y - 10,
        size: 8,
        lineHeight: 11,
        textColor: color.muted,
      });
    }
    this.y -= height + 7;
  }

  private notice() {
    const height = 62;
    this.ensureSpace(height + 8);
    this.page.drawRectangle({
      x: CONTENT_LEFT,
      y: this.y - height,
      width: CONTENT_WIDTH,
      height,
      color: color.accentSoft,
      borderColor: rgb(238 / 255, 210 / 255, 157 / 255),
      borderWidth: 0.8,
    });
    this.page.drawRectangle({
      x: CONTENT_LEFT,
      y: this.y - height,
      width: 5,
      height,
      color: color.accent,
    });
    this.page.drawText("IMPORTANT LIMITATION", {
      x: CONTENT_LEFT + 18,
      y: this.y - 20,
      size: 7,
      font: this.fonts.bold,
      color: rgb(138 / 255, 87 / 255, 20 / 255),
    });
    const lines = wrapText(
      "Not an eligibility decision. This packet organizes renter-confirmed facts and a frozen numerical comparison. A qualified human reviewer makes every program determination. Nothing has been sent.",
      this.fonts.regular,
      8.5,
      CONTENT_WIDTH - 36,
    );
    this.drawLines({
      lines,
      x: CONTENT_LEFT + 18,
      y: this.y - 37,
      size: 8.5,
      lineHeight: 11,
    });
    this.y -= height + 14;
  }

  private cover() {
    this.page.drawText("REALDOOR APPLICATION-READINESS PACKET", {
      x: CONTENT_LEFT,
      y: this.y,
      size: 7,
      font: this.fonts.bold,
      color: color.muted,
    });
    this.y -= 41;
    this.page.drawText("Your application", {
      x: CONTENT_LEFT,
      y: this.y,
      size: 28,
      font: this.fonts.bold,
      color: color.ink,
    });
    this.y -= 34;
    this.page.drawText("readiness packet", {
      x: CONTENT_LEFT,
      y: this.y,
      size: 28,
      font: this.fonts.bold,
      color: color.ink,
    });
    this.y -= 30;
    this.paragraph(this.model.metro, {
      size: 11,
      lineHeight: 15,
      font: this.fonts.bold,
      textColor: color.brand,
      gap: 2,
    });
    this.paragraph(this.model.program, { size: 9, textColor: color.muted, gap: 14 });
    this.notice();

    this.row({
      label: "Packet version",
      value: `Revision ${this.model.revision}`,
      detail: `Generated ${this.model.generatedAt}`,
    });
    this.row({
      label: "Frozen guide",
      value: this.model.ruleEffectiveDate,
      detail: this.model.ruleVersion,
    });
    this.row({
      label: "Checklist date",
      value: this.model.asOfDate,
      detail: this.model.timezone,
    });
  }

  private facts() {
    this.sectionTitle("Confirmed facts and evidence", "01 | Renter-confirmed profile");
    if (this.model.facts.length === 0) {
      this.paragraph("No confirmed facts were selected for this packet.", {
        textColor: color.muted,
      });
      return;
    }
    this.model.facts.forEach((fact) => {
      const evidence = [fact.source, fact.page ? `page ${fact.page}` : "", fact.sourceQuote ?? ""]
        .filter(Boolean)
        .join(" | ");
      this.row({ label: fact.label, value: fact.value, detail: evidence });
    });
  }

  private worksheet() {
    this.sectionTitle("Income worksheet", "02 | Deterministic calculation");
    if (this.model.worksheet.status === "unresolved") {
      this.row({
        label: "Worksheet state",
        value: "Unresolved",
        detail: this.model.worksheet.reason ?? "Confirmed inputs are incomplete.",
      });
      return;
    }
    this.row({
      label: "Annualized gross income",
      value: money(this.model.worksheet.annualIncome ?? 0),
      detail: "Calculated from renter-confirmed recurring income",
    });
    this.row({
      label: "Frozen 60% threshold",
      value: money(this.model.worksheet.incomeLimit ?? 0),
      detail: `Effective ${this.model.ruleEffectiveDate}`,
    });
    this.row({
      label: "Numerical difference",
      value: money(this.model.worksheet.difference ?? 0),
      detail: "A comparison only - not an eligibility result",
    });
    this.paragraph(`Arithmetic: ${this.model.worksheet.formula ?? "Unavailable"}`, {
      size: 8.5,
      lineHeight: 12,
      font: this.fonts.bold,
      textColor: color.brand,
      gap: 12,
    });
  }

  private checklist() {
    this.sectionTitle("Application checklist", "03 | Document review");
    this.paragraph(
      `Frozen as of ${this.model.asOfDate} in ${this.model.timezone}. Status describes this session only and does not predict reviewer acceptance.`,
      { size: 8.5, textColor: color.muted, gap: 8 },
    );
    this.model.checklist.forEach((item) => {
      this.row({
        label: item.label,
        value: item.state,
        detail: `${item.reason} | ${item.sourceId}`,
        status: item.state,
      });
    });
  }

  private documents() {
    this.sectionTitle("Selected evidence index", "04 | Included by renter");
    if (this.model.documents.length === 0) {
      this.paragraph("No source documents were selected.", { textColor: color.muted });
      return;
    }
    this.model.documents.forEach((document) => {
      this.row({
        label: document.name,
        value: document.kind,
        detail: document.issuedOn ?? "Date unresolved",
      });
    });
  }

  private questions() {
    this.sectionTitle("Questions and reviewer items", "05 | Saved explanations");
    if (this.model.questions.length === 0) {
      this.paragraph("No saved questions.", { textColor: color.muted });
      return;
    }
    this.model.questions.forEach((question) => {
      this.paragraph(`Question: ${question.question}`, {
        font: this.fonts.bold,
        textColor: color.brand,
        gap: 2,
      });
      this.paragraph(question.answer, { size: 8.5, gap: 2 });
      this.paragraph(
        `Sources: ${question.sourceIds.join(", ") || "No supporting passage - unresolved"}`,
        { size: 7.5, textColor: color.muted, gap: 12 },
      );
    });
  }

  private sources() {
    this.sectionTitle("Frozen rules and citations", "06 | Source register");
    this.paragraph(
      `Version ${this.model.ruleVersion} | Effective ${this.model.ruleEffectiveDate}`,
      { size: 8.5, font: this.fonts.bold, textColor: color.brand, gap: 10 },
    );
    this.model.sources.forEach((source) => {
      this.paragraph(`${source.id} | ${source.title}${source.locator ? ` | ${source.locator}` : ""}`, {
        size: 8.5,
        font: this.fonts.bold,
        gap: 2,
      });
      this.paragraph(source.passage, { size: 8, lineHeight: 11, gap: 2 });
      if (source.url.trim()) {
        this.paragraph(source.url, { size: 7, lineHeight: 10, textColor: color.muted, gap: 12 });
      }
    });
  }

  private finishPages() {
    this.pages.forEach((page, index) => {
      page.drawLine({
        start: { x: CONTENT_LEFT, y: 52 },
        end: { x: CONTENT_RIGHT, y: 52 },
        thickness: 0.75,
        color: color.line,
      });
      page.drawText(`Session ${normalizePdfText(this.model.sessionId)} | Downloaded to you; not sent`, {
        x: CONTENT_LEFT,
        y: 34,
        size: 6.8,
        font: this.fonts.regular,
        color: color.muted,
      });
      page.drawText(`${index + 1} / ${this.pages.length}`, {
        x: 548,
        y: 34,
        size: 6.8,
        font: this.fonts.bold,
        color: color.muted,
      });
    });
  }

  render() {
    this.addPage();
    this.cover();
    this.facts();
    this.worksheet();
    this.checklist();
    this.documents();
    this.questions();
    this.sources();
    this.finishPages();
  }
}

export async function renderReadinessPacket(model: PacketModel, brandLogoBytes: Uint8Array) {
  const pdf = await PDFDocument.create();
  const fonts = {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
  };
  const logo = await pdf.embedPng(brandLogoBytes);
  const stableDate = new Date(`${model.asOfDate}T12:00:00.000Z`);

  pdf.setTitle("RealDoor application-readiness packet");
  pdf.setAuthor("RealDoor");
  pdf.setSubject("Renter-controlled application-readiness packet");
  pdf.setCreator("RealDoor Application Readiness");
  pdf.setProducer("RealDoor Document System");
  pdf.setCreationDate(stableDate);
  pdf.setModificationDate(stableDate);

  new PacketRenderer(pdf, fonts, logo, model).render();
  return pdf.save({ useObjectStreams: false });
}
