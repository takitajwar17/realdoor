import type { FactKey, ReadinessDocument } from "./domain";

const FACT_LABELS: Record<FactKey, string> = {
  person_name: "Name",
  address: "Address",
  household_size: "Household size",
  application_date: "Application date",
  pay_date: "Pay date",
  pay_period_start: "Pay period start",
  pay_period_end: "Pay period end",
  pay_frequency: "Pay frequency",
  regular_hours: "Regular hours",
  hourly_rate: "Hourly rate",
  gross_pay: "Gross pay",
  net_pay: "Net pay",
  document_date: "Document date",
  weekly_hours: "Weekly hours",
  monthly_benefit: "Monthly benefit",
  benefit_frequency: "Benefit frequency",
  statement_month: "Statement month",
  gross_receipts: "Gross receipts",
  platform_fees: "Platform fees",
};

const DOCUMENT_KIND_LABELS: Record<ReadinessDocument["kind"], string> = {
  application_summary: "Application summary",
  pay_stub: "Pay statement",
  employment_letter: "Employment letter",
  benefit_letter: "Benefit letter",
  gig_statement: "Gig statement",
  gig_income_corroboration: "Gig income corroboration",
  other: "Other document",
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const MONEY_KEYS = new Set<FactKey>([
  "hourly_rate",
  "gross_pay",
  "net_pay",
  "monthly_benefit",
  "gross_receipts",
  "platform_fees",
]);

export function getFactLabel(key: string) {
  return FACT_LABELS[key as FactKey] ?? "Profile detail";
}

export function formatFactValue(key: string, value: string) {
  if (!MONEY_KEYS.has(key as FactKey)) return value;
  const amount = Number(value.replaceAll(",", "").replaceAll("$", "").trim());
  return Number.isFinite(amount) ? money.format(amount) : value;
}

export function getDocumentKindLabel(kind: string) {
  return DOCUMENT_KIND_LABELS[kind as ReadinessDocument["kind"]] ?? "Other document";
}

/** Shorten stored geography labels for renter-facing chrome. */
export function formatMetroLabel(metro: string) {
  return metro
    .replace(/\s+HUD Metro FMR Area$/u, "")
    .replace(/\s+HMFA$/u, "")
    .replace(/,\s*MA-NH$/u, ", MA-NH")
    .trim();
}

/** Shorten stored program labels for renter-facing chrome. */
export function formatProgramLabel(program: string) {
  return program
    .replace(/\bfrozen\s+/giu, "")
    .replace(/\bMTSP\b/gu, "income limit")
    .replace(/\bAMI\b/gu, "income limit")
    .replace(/\s+practice comparison$/iu, "")
    .replace(/\s+comparison$/iu, "")
    .replace(/\s{2,}/gu, " ")
    .trim();
}
