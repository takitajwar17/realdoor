export const FACT_KEYS = [
  "person_name",
  "address",
  "household_size",
  "application_date",
  "pay_date",
  "pay_period_start",
  "pay_period_end",
  "pay_frequency",
  "regular_hours",
  "hourly_rate",
  "gross_pay",
  "net_pay",
  "document_date",
  "weekly_hours",
  "monthly_benefit",
  "benefit_frequency",
  "statement_month",
  "gross_receipts",
  "platform_fees",
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
  factId?: string;
  documentId?: string | null;
  sourceQuote?: string | null;
  page?: number | null;
  box?: EvidenceBox | null;
  origin?: "extracted" | "manual";
  confidence?: number | null;
};

export type SourceCitation = {
  id: string;
  title: string;
  url: string;
  passage: string;
  locator?: string;
  effectiveDate?: string | null;
  authority?: string;
};

export type RulePack = {
  id: string;
  label: string;
  program: string;
  metro: string;
  year: number;
  effectiveDate: string;
  version: string;
  authority: "official" | "organizer";
  incomeLimits60Percent: Partial<Record<number, number>>;
  calculationSourceIds: string[];
  checklistRequirements: ChecklistRequirement[];
  sources: SourceCitation[];
};

export type ChecklistRequirement = {
  id: string;
  label: string;
  kind: ReadinessDocument["kind"];
  maxAgeDays: number | null;
  sourceId: string;
};

export type ReadinessDocument = {
  id: string;
  kind:
    | "application_summary"
    | "pay_stub"
    | "employment_letter"
    | "benefit_letter"
    | "gig_statement"
    | "gig_income_corroboration"
    | "other";
  name: string;
  issuedOn: string | null;
  included: boolean;
  metadataConfirmed: boolean;
};

function clampUnit(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function normalizeEvidenceBox(box: EvidenceBox | undefined): EvidenceBox | undefined {
  if (!box) return undefined;
  const values = [box.x, box.y, box.width, box.height];
  if (
    values.some((value) => !Number.isFinite(value)) ||
    box.x < 0 || box.y < 0 || box.width <= 0 || box.height <= 0 ||
    box.x + box.width > 1 || box.y + box.height > 1
  ) return undefined;
  return { ...box };
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

  const normalizedBox = normalizeEvidenceBox(input.box);
  if (input.box && !normalizedBox) return null;

  return {
    key: input.key as FactKey,
    value,
    confidence: clampUnit(input.confidence),
    sourceQuote,
    ...(typeof input.page === "number" && input.page > 0 ? { page: Math.floor(input.page) } : {}),
    ...(normalizedBox ? { box: normalizedBox } : {}),
    status: "extracted",
  };
}

export function isTraceableDocumentFact(fact: ExtractedFact) {
  return Boolean(
    fact.sourceQuote.trim() && fact.page && fact.box && fact.confidence >= 0 && fact.confidence <= 1,
  );
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
  components: Array<{ label: string; annualAmount: number; formula: string }>;
  annualIncome: number | null;
  formula: string | null;
} {
  const byKey = confirmedFactMap(facts);
  const weeklyHours = parseNonNegativeNumber(byKey.get("weekly_hours")?.value ?? "");
  const hourlyRate = parseNonNegativeNumber(byKey.get("hourly_rate")?.value ?? "");
  const grossPay = parseNonNegativeNumber(byKey.get("gross_pay")?.value ?? "");
  const payFrequency = byKey.get("pay_frequency")?.value.trim().toLocaleLowerCase("en-US");
  const frequencyMultiplier: Record<string, number> = {
    weekly: 52,
    biweekly: 26,
    semimonthly: 24,
    monthly: 12,
    annual: 1,
  };
  const components: Array<{ label: string; annualAmount: number; formula: string }> = [];

  if (weeklyHours !== null && hourlyRate !== null) {
    const annualAmount = weeklyHours * hourlyRate * 52;
    components.push({
      label: "Employment income",
      annualAmount,
      formula: `${weeklyHours} hours × ${formatCurrency(hourlyRate)} × 52 weeks = ${formatCurrency(annualAmount)}`,
    });
  } else if (grossPay !== null && payFrequency && frequencyMultiplier[payFrequency]) {
    const multiplier = frequencyMultiplier[payFrequency];
    const annualAmount = grossPay * multiplier;
    components.push({
      label: "Employment income",
      annualAmount,
      formula: `${formatCurrency(grossPay)} × ${multiplier} ${payFrequency} periods = ${formatCurrency(annualAmount)}`,
    });
  }

  const monthlyBenefit = parseNonNegativeNumber(byKey.get("monthly_benefit")?.value ?? "");
  if (monthlyBenefit !== null) {
    const annualAmount = monthlyBenefit * 12;
    components.push({
      label: "Benefit income",
      annualAmount,
      formula: `${formatCurrency(monthlyBenefit)} × 12 months = ${formatCurrency(annualAmount)}`,
    });
  }

  const grossReceipts = parseNonNegativeNumber(byKey.get("gross_receipts")?.value ?? "");
  if (grossReceipts !== null) {
    const annualAmount = grossReceipts * 12;
    components.push({
      label: "Gig receipts",
      annualAmount,
      formula: `${formatCurrency(grossReceipts)} × 12 months = ${formatCurrency(annualAmount)}`,
    });
  }

  if (components.length === 0) {
    return {
      status: "unresolved",
      missing: ["gross_pay", "pay_frequency"],
      components: [],
      annualIncome: null,
      formula: null,
    };
  }
  const annualIncome = components.reduce((total, component) => total + component.annualAmount, 0);

  return {
    status: "complete",
    missing: [],
    components,
    annualIncome,
    formula: `${components.map((component) => formatCurrency(component.annualAmount)).join(" + ")} = ${formatCurrency(annualIncome)} annualized gross income`,
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
      reason: `Confirm ${summary.missing.map((key) => key.replaceAll("_", " ")).join(", ")} before comparing income.`,
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
      reason: `No practice income limit is available for a household of ${householdSize}.`,
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
    sourceIds: input.rulePack.calculationSourceIds,
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

  const sourceIds = new Set(pack.sources.map(({ id }) => id));
  if (
    pack.calculationSourceIds.length === 0 ||
    pack.calculationSourceIds.some((id) => !sourceIds.has(id))
  ) {
    throw new Error("Calculation sources must resolve to saved source passages");
  }

  if (
    pack.checklistRequirements.length === 0 ||
    pack.checklistRequirements.some((requirement) => !sourceIds.has(requirement.sourceId))
  ) {
    throw new Error("Checklist requirements must resolve to saved source passages");
  }

  return pack;
}

export type ChecklistState = "present" | "missing" | "expired" | "unresolved";

export type ChecklistItem = {
  id: string;
  label: string;
  state: ChecklistState;
  reason: string;
  sourceId: string;
  asOf: string;
  maxAgeDays: number | null;
  documentId?: string;
};

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

  return input.rules.checklistRequirements.map((requirement) => {
    const document = input.documents.find(({ kind }) => kind === requirement.kind);
    if (!document) {
      return {
        id: requirement.id,
        label: requirement.label,
        state: "missing",
        reason: "Not added to this session yet.",
        sourceId: requirement.sourceId,
        asOf: input.asOf,
        maxAgeDays: requirement.maxAgeDays,
      };
    }

    if (!document.metadataConfirmed) {
      return {
        id: requirement.id,
        label: requirement.label,
        state: "unresolved",
        reason: "Confirm the document type and date first.",
        sourceId: requirement.sourceId,
        asOf: input.asOf,
        maxAgeDays: requirement.maxAgeDays,
        documentId: document.id,
      };
    }

    if (requirement.maxAgeDays === null) {
      return {
        id: requirement.id,
        label: requirement.label,
        state: "present",
        reason: "Present in this session.",
        sourceId: requirement.sourceId,
        asOf: input.asOf,
        maxAgeDays: requirement.maxAgeDays,
        documentId: document.id,
      };
    }

    if (!document.issuedOn) {
      return {
        id: requirement.id,
        label: requirement.label,
        state: "unresolved",
        reason: "Present, but the document date still needs confirmation.",
        sourceId: requirement.sourceId,
        asOf: input.asOf,
        maxAgeDays: requirement.maxAgeDays,
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
        sourceId: requirement.sourceId,
        asOf: input.asOf,
        maxAgeDays: requirement.maxAgeDays,
        documentId: document.id,
      };
    }

    if (ageDays > requirement.maxAgeDays) {
      return {
        id: requirement.id,
        label: requirement.label,
        state: "expired",
        reason: `Dated ${document.issuedOn}; ${ageDays} days old as of ${input.asOf}. This practice guide uses a ${requirement.maxAgeDays}-day window.`,
        sourceId: requirement.sourceId,
        asOf: input.asOf,
        maxAgeDays: requirement.maxAgeDays,
        documentId: document.id,
      };
    }

    return {
      id: requirement.id,
      label: requirement.label,
      state: "present",
      reason: `Dated ${document.issuedOn}; within the ${requirement.maxAgeDays}-day practice window as of ${input.asOf}.`,
      sourceId: requirement.sourceId,
      asOf: input.asOf,
      maxAgeDays: requirement.maxAgeDays,
      documentId: document.id,
    };
  });
}

export function buildAuditEntry<
  T extends {
    action: string;
    sessionId: string;
    subjectId?: string;
    occurredAt: string;
  },
>(input: T): T {
  return input;
}
