import type { FactKey, ReadinessDocument } from "./domain";

const FACT_LABELS: Record<FactKey, string> = {
  household_size: "Household size",
  employment_monthly_income: "Employment income each month",
  benefits_monthly_income: "Benefits income each month",
  other_monthly_income: "Other income each month",
  full_name: "Full name",
  current_address: "Current address",
  document_issued_on: "Document date",
};

const DOCUMENT_KIND_LABELS: Record<ReadinessDocument["kind"], string> = {
  pay_stub: "Pay statement",
  benefits_letter: "Benefits letter",
  photo_id: "Photo ID",
  bank_statement: "Bank statement",
  other: "Other document",
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export function getFactLabel(key: string) {
  return FACT_LABELS[key as FactKey] ?? "Profile detail";
}

export function formatFactValue(key: string, value: string) {
  if (!key.includes("income")) return value;

  const amount = Number(value.replaceAll(",", "").replaceAll("$", "").trim());
  return Number.isFinite(amount) ? `${money.format(amount)} per month` : value;
}

export function getDocumentKindLabel(kind: string) {
  return DOCUMENT_KIND_LABELS[kind as ReadinessDocument["kind"]] ?? "Other document";
}
