export const FACT_KEYS = [
  "household_size",
  "employment_monthly_income",
  "benefits_monthly_income",
  "other_monthly_income",
  "full_name",
  "current_address",
  "document_issued_on",
] as const;

export type FactKey = (typeof FACT_KEYS)[number];

export const ALLOWED_FACT_KEYS: ReadonlySet<string> = new Set(FACT_KEYS);

export type EvidenceBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ExtractedFact = {
  key: FactKey;
  value: string;
  confidence: number;
  sourceQuote: string;
  page?: number;
  box?: EvidenceBox;
  status: "extracted";
};

export type ConfirmedFact = {
  key: FactKey;
  value: string;
  status: "confirmed";
  updatedAt: string;
};

export type SourceCitation = {
  id: string;
  title: string;
  url: string;
  passage: string;
};

export type RulePack = {
  id: string;
  label: string;
  program: string;
  metro: string;
  year: number;
  effectiveDate: string;
  version: string;
  authority: "official" | "organizer" | "synthetic-rehearsal";
  incomeLimits60Percent: Partial<Record<number, number>>;
  sources: SourceCitation[];
};

export type ReadinessDocument = {
  id: string;
  kind: "pay_stub" | "benefits_letter" | "photo_id" | "bank_statement" | "other";
  name: string;
  issuedOn: string | null;
  included: boolean;
};

function clampUnit(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function normalizeEvidenceBox(box: EvidenceBox | undefined): EvidenceBox | undefined {
  if (!box) return undefined;

  const x = clampUnit(box.x);
  const y = clampUnit(box.y);

  return {
    x,
    y,
    width: Math.min(clampUnit(box.width), 1 - x),
    height: Math.min(clampUnit(box.height), 1 - y),
  };
}

export function normalizeExtractedFact(input: {
  key: string;
  value: string;
  confidence: number;
  sourceQuote: string;
  page?: number;
  box?: EvidenceBox;
}): ExtractedFact | null {
  if (!ALLOWED_FACT_KEYS.has(input.key)) return null;

  const value = input.value.trim();
  const sourceQuote = input.sourceQuote.trim();
  if (!value || !sourceQuote) return null;

  return {
    key: input.key as FactKey,
    value,
    confidence: clampUnit(input.confidence),
    sourceQuote,
    ...(typeof input.page === "number" && input.page > 0
      ? { page: Math.floor(input.page) }
      : {}),
    ...(input.box ? { box: normalizeEvidenceBox(input.box) } : {}),
    status: "extracted",
  };
}

export function detectFactConflicts(facts: ExtractedFact[]): FactKey[] {
  const valuesByKey = new Map<FactKey, Set<string>>();

  for (const fact of facts) {
    const values = valuesByKey.get(fact.key) ?? new Set<string>();
    values.add(fact.value.trim().toLocaleLowerCase("en-US"));
    valuesByKey.set(fact.key, values);
  }

  return FACT_KEYS.filter((key) => (valuesByKey.get(key)?.size ?? 0) > 1);
}

const INCOME_FACT_KEYS = [
  "employment_monthly_income",
  "benefits_monthly_income",
  "other_monthly_income",
] as const satisfies readonly FactKey[];

function parseNonNegativeNumber(value: string): number | null {
  const normalized = value.replaceAll(",", "").replaceAll("$", "").trim();
  if (!normalized) return null;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
}

function confirmedFactMap(facts: ConfirmedFact[]) {
  return new Map(facts.map((fact) => [fact.key, fact]));
}

export function summarizeConfirmedIncome(facts: ConfirmedFact[]): {
  status: "complete" | "unresolved";
  missing: FactKey[];
  monthlyIncome: number | null;
  annualIncome: number | null;
  formula: string | null;
} {
  const byKey = confirmedFactMap(facts);
  const values = INCOME_FACT_KEYS.map((key) => ({
    key,
    value: parseNonNegativeNumber(byKey.get(key)?.value ?? ""),
  }));
  const missing = values.filter(({ value }) => value === null).map(({ key }) => key);

  if (missing.length > 0) {
    return {
      status: "unresolved",
      missing,
      monthlyIncome: null,
      annualIncome: null,
      formula: null,
    };
  }

  const monthlyValues = values.map(({ value }) => value as number);
  const monthlyIncome = monthlyValues.reduce((total, value) => total + value, 0);
  const annualIncome = monthlyIncome * 12;

  return {
    status: "complete",
    missing: [],
    monthlyIncome,
    annualIncome,
    formula: `(${monthlyValues.map(formatCurrency).join(" + ")}) × 12 = ${formatCurrency(annualIncome)}`,
  };
}

export type IncomeComparison =
  | {
      status: "unresolved";
      reason: string;
      annualIncome: null;
      incomeLimit: null;
    }
  | {
      status: "complete";
      annualIncome: number;
      incomeLimit: number;
      difference: number;
      relationship: "below" | "equal" | "above";
      formula: string;
      sourceIds: string[];
    };

export function calculateIncomeComparison(input: {
  facts: ConfirmedFact[];
  rulePack: RulePack;
}): IncomeComparison {
  validateRulePack(input.rulePack, 2026);

  const summary = summarizeConfirmedIncome(input.facts);
  if (summary.status === "unresolved" || summary.annualIncome === null) {
    return {
      status: "unresolved",
      reason: `Confirm ${summary.missing.join(", ").replaceAll("_", " ")} before comparing income.`,
      annualIncome: null,
      incomeLimit: null,
    };
  }

  const householdSize = parseNonNegativeNumber(
    confirmedFactMap(input.facts).get("household_size")?.value ?? "",
  );

  if (!householdSize || !Number.isInteger(householdSize)) {
    return {
      status: "unresolved",
      reason: "Confirm a whole-number household size before comparing income.",
      annualIncome: null,
      incomeLimit: null,
    };
  }

  const incomeLimit = input.rulePack.incomeLimits60Percent[householdSize];
  if (typeof incomeLimit !== "number") {
    return {
      status: "unresolved",
      reason: `No 2026 threshold is available for a household of ${householdSize}.`,
      annualIncome: null,
      incomeLimit: null,
    };
  }

  const difference = summary.annualIncome - incomeLimit;

  return {
    status: "complete",
    annualIncome: summary.annualIncome,
    incomeLimit,
    difference,
    relationship: difference < 0 ? "below" : difference > 0 ? "above" : "equal",
    formula: `${formatCurrency(summary.annualIncome)} − ${formatCurrency(incomeLimit)} = ${formatCurrency(difference)}`,
    sourceIds: input.rulePack.sources.map(({ id }) => id),
  };
}

export function validateRulePack(pack: RulePack, sessionYear: number): RulePack {
  if (pack.year !== sessionYear) {
    throw new Error(`Rule pack year ${pack.year} does not match session year ${sessionYear}`);
  }

  if (!pack.version.trim() || !pack.effectiveDate.trim()) {
    throw new Error("Rule pack must include a version and effective date");
  }

  if (pack.sources.length === 0) {
    throw new Error("Rule pack must include at least one source citation");
  }

  return pack;
}

export type ChecklistState = "present" | "missing" | "expired" | "unresolved";

type ChecklistItem = {
  id: string;
  label: string;
  state: ChecklistState;
  reason: string;
  documentId?: string;
};

const CHECKLIST_REQUIREMENTS: Array<{
  id: string;
  label: string;
  kind: ReadinessDocument["kind"];
  maxAgeDays: number | null;
}> = [
  { id: "pay-stub", label: "Recent pay stub", kind: "pay_stub", maxAgeDays: 120 },
  {
    id: "benefits-letter",
    label: "Benefits verification letter",
    kind: "benefits_letter",
    maxAgeDays: 365,
  },
  { id: "photo-id", label: "Photo identification", kind: "photo_id", maxAgeDays: null },
  {
    id: "bank-statement",
    label: "Recent bank statement",
    kind: "bank_statement",
    maxAgeDays: 90,
  },
];

function daysBetween(earlierIsoDate: string, laterIsoDate: string) {
  const earlier = Date.parse(`${earlierIsoDate}T00:00:00.000Z`);
  const later = Date.parse(`${laterIsoDate}T00:00:00.000Z`);
  if (!Number.isFinite(earlier) || !Number.isFinite(later)) return null;
  return Math.floor((later - earlier) / 86_400_000);
}

export function deriveChecklist(input: {
  asOf: string;
  documents: ReadinessDocument[];
  rules: RulePack;
}): ChecklistItem[] {
  validateRulePack(input.rules, 2026);

  return CHECKLIST_REQUIREMENTS.map((requirement) => {
    const document = input.documents.find(({ kind }) => kind === requirement.kind);
    if (!document) {
      return {
        id: requirement.id,
        label: requirement.label,
        state: "missing",
        reason: "Missing from this session.",
      };
    }

    if (requirement.maxAgeDays === null) {
      return {
        id: requirement.id,
        label: requirement.label,
        state: "present",
        reason: "Present in this session.",
        documentId: document.id,
      };
    }

    if (!document.issuedOn) {
      return {
        id: requirement.id,
        label: requirement.label,
        state: "unresolved",
        reason: "Present in this session, but its issue date is unresolved.",
        documentId: document.id,
      };
    }

    const ageDays = daysBetween(document.issuedOn, input.asOf);
    if (ageDays === null || ageDays < 0) {
      return {
        id: requirement.id,
        label: requirement.label,
        state: "unresolved",
        reason: "The document date could not be verified.",
        documentId: document.id,
      };
    }

    if (ageDays > requirement.maxAgeDays) {
      return {
        id: requirement.id,
        label: requirement.label,
        state: "expired",
        reason: `Expired per this checklist (${ageDays} days old; limit ${requirement.maxAgeDays}).`,
        documentId: document.id,
      };
    }

    return {
      id: requirement.id,
      label: requirement.label,
      state: "present",
      reason: "Present in this session and within this checklist's date window.",
      documentId: document.id,
    };
  });
}

export function buildAuditEntry<T extends {
  action: string;
  sessionId: string;
  subjectId?: string;
  occurredAt: string;
}>(input: T): T {
  return input;
}
