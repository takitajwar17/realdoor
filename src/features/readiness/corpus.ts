import { GENERATED_READINESS_CORPUS } from "./corpus.generated";

export const CORPUS_AS_OF = { date: "2026-07-18", timezone: "America/New_York" } as const;

export const FROZEN_RULES = GENERATED_READINESS_CORPUS.rules.map((rule) => ({
  ruleId: rule.rule_id,
  authority: rule.authority,
  effectiveDate: rule.effective_date,
  text: rule.text,
  sourceUrl: rule.source_url,
  sourceLocator: rule.source_locator,
}));

export const MTSP_LIMITS_2026 = GENERATED_READINESS_CORPUS.limits.map((row) => ({
  fiscalYear: Number(row.fiscal_year),
  effectiveDate: row.effective_date,
  hudArea: row.hud_area,
  medianFamilyIncome: Number(row.median_family_income),
  householdSize: Number(row.household_size),
  incomeLimit50Percent: Number(row.income_limit_50_percent),
  incomeLimit60Percent: Number(row.income_limit_60_percent),
  coreChallengeThreshold: Number(row.core_challenge_threshold),
  sourcePdfPage: Number(row.source_pdf_page),
  sourceUrl: row.source_url,
}));

export const APPLICATION_CHECKLISTS = GENERATED_READINESS_CORPUS.checklists;
export const QA_GOLD = GENERATED_READINESS_CORPUS.qa;
export const ADVERSARIAL_TESTS = GENERATED_READINESS_CORPUS.adversarial;
export const DOCUMENT_MANIFEST = GENERATED_READINESS_CORPUS.manifest;
export const SCENARIO_GOLD = GENERATED_READINESS_CORPUS.scenarios;
export const FIELD_SCHEMA = GENERATED_READINESS_CORPUS.fieldSchema;

export const DOCUMENT_GOLD = GENERATED_READINESS_CORPUS.documents.map((document) => ({
  documentId: document.document_id,
  householdId: document.household_id,
  documentType: document.document_type,
  fileName: document.file_name,
  synthetic: document.synthetic,
  rasterized: document.rasterized,
  containsAdversarialText: document.contains_adversarial_text,
  pageCount: document.page_count,
  pageSizePoints: document.page_size_points,
  fields: document.fields.map((field) => ({
    field: field.field,
    value: field.value,
    page: field.page,
    bbox: field.bbox,
    bboxUnits: field.bbox_units,
  })),
}));

export function getFrozenRule(ruleId: string) {
  return FROZEN_RULES.find((rule) => rule.ruleId === ruleId);
}

export function getGoldHousehold(householdId: string) {
  return APPLICATION_CHECKLISTS.find((item) => item.household_id === householdId);
}

export function getGoldDocumentByFileName(fileName: string) {
  return DOCUMENT_GOLD.find((document) => document.fileName === fileName);
}
