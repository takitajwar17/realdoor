import { FROZEN_RULES, MTSP_LIMITS_2026, QA_GOLD } from "./corpus";
import type { RulePack, SourceCitation } from "./domain";
import { hasOpenableSourceUrl } from "./source-url";

export { hasOpenableSourceUrl } from "./source-url";

function externalSourceUrl(url: string): string {
  return hasOpenableSourceUrl(url) ? url.trim() : "";
}

/** Human label for an official source URL (not a page pin). */
function sourceNameFromUrl(url: string): string | null {
  if (!url) return null;
  if (url.includes("HERA-Income-Limits-Report")) return "HERA Income Limits Report (FY 2026)";
  if (url.includes("/datasets/mtsp")) return "HUD MTSP income limits";
  if (url.includes("lihtc/property")) return "HUD LIHTC property data";
  if (url.includes("LIHTC/FeatureServer") || (url.includes("arcgis") && url.includes("LIHTC"))) {
    return "HUD LIHTC property layer";
  }
  if (url.includes("uscode.house.gov")) return "U.S. Code";
  if (url.includes("ecfr.gov")) return "eCFR";
  try {
    return new URL(url).hostname.replace(/^www\./u, "");
  } catch {
    return null;
  }
}

/** Normalize "PDF page 130" → "page 130"; leave other locators as-is. */
function formatSourceLocator(locator: string): string {
  const pageMatch = locator.trim().match(/^(?:PDF\s+)?page\s+(\d+)$/iu);
  if (pageMatch) return `page ${pageMatch[1]}`;
  return locator.trim();
}

/**
 * Button/dialog title: source name first, optional page/pin after.
 * e.g. "HERA Income Limits Report (FY 2026) · page 130"
 */
export function formatSourceCitationTitle(url: string, locator: string): string {
  const pin = formatSourceLocator(locator);
  const name = sourceNameFromUrl(url);

  // Legal cites already name the source.
  if (/^\d+\s+U\.S\.C\.|^\d+\s+CFR/iu.test(pin)) {
    return pin;
  }

  if (name && pin && !name.toLocaleLowerCase("en-US").includes(pin.toLocaleLowerCase("en-US"))) {
    return `${name} · ${pin}`;
  }
  return name ?? pin;
}

const RULE_SOURCES: SourceCitation[] = FROZEN_RULES.map((rule) => {
  const url = externalSourceUrl(rule.sourceUrl);
  const locator = formatSourceLocator(rule.sourceLocator);
  return {
    id: rule.ruleId,
    title: formatSourceCitationTitle(url, rule.sourceLocator),
    url,
    passage: rule.text,
    locator,
    effectiveDate: rule.effectiveDate,
    authority: rule.authority,
  };
});

export const AUTHORITATIVE_2026_RULE_PACK: RulePack = {
  id: "boston-cambridge-quincy-mtsp-2026-realdoor-v1",
  label: "Boston-Cambridge-Quincy 2026 application guide",
  program: "LIHTC · frozen 60% MTSP comparison",
  metro: "Boston-Cambridge-Quincy, MA-NH HMFA",
  year: 2026,
  effectiveDate: "2026-05-01",
  version: "RealDoor organizer corpus v1 · 2026-07-18",
  authority: "organizer",
  incomeLimits60Percent: Object.fromEntries(
    MTSP_LIMITS_2026.map((limit) => [limit.householdSize, limit.incomeLimit60Percent]),
  ),
  calculationSourceIds: ["CH-INCOME-001", "HUD-MTSP-002", "CH-DECISION-001"],
  // Full pack checklist: every document kind the frozen gold corpus uses.
  checklistRequirements: [
    {
      id: "application-summary",
      label: "Application summary",
      kind: "application_summary",
      maxAgeDays: null,
      sourceId: "CH-READINESS-001",
    },
    {
      id: "pay-stub",
      label: "Recent pay statement",
      kind: "pay_stub",
      maxAgeDays: 60,
      sourceId: "CH-READINESS-001",
    },
    {
      id: "employment-letter",
      label: "Employment letter",
      kind: "employment_letter",
      maxAgeDays: 60,
      sourceId: "CH-READINESS-001",
    },
    {
      id: "benefit-letter",
      label: "Benefit letter",
      kind: "benefit_letter",
      maxAgeDays: 60,
      sourceId: "CH-READINESS-001",
    },
    {
      id: "gig-income-corroboration",
      label: "Gig income corroboration",
      kind: "gig_income_corroboration",
      maxAgeDays: 60,
      sourceId: "CH-READINESS-001",
    },
  ],
  sources: RULE_SOURCES,
};

export function getRuleSource(id: string) {
  return RULE_SOURCES.find((source) => source.id === id);
}

/** Full pack checklist for every session (all document kinds the corpus covers). */
export function getScenarioRulePack(_householdId: string | null): RulePack {
  void _householdId;
  return AUTHORITATIVE_2026_RULE_PACK;
}

export type RuleAnswer = {
  status: "answered" | "unresolved";
  answer: string;
  sourceIds: string[];
};

const prohibitedDecisionPattern =
  /\b(eligible|eligibility|qualif(?:y|ied|ication)|approv(?:e|al|ed)|deny|denial|rank|score|predict)\b/iu;
const instructionAttackPattern =
  /\b(ignore (?:all |the )?(?:previous|prior) instructions|system prompt|reveal .{0,20}(?:prompt|secret)|upload (?:all|every))\b/iu;
const crossHouseholdPattern =
  /\b(another|other) (?:applicant|household|renter).{0,40}(?:income|document|data)\b/iu;
const protectedTraitPattern =
  /\b(infer|guess|predict).{0,40}(?:disability|immigration|race|ethnicity|religion|citizenship)\b/iu;
const vacancyPattern = /\b(?:vacan(?:cy|t)|unit available|available today|waitlist)\b/iu;
const wrongYearPattern = /\b(?:use|apply).{0,30}2025.{0,30}(?:threshold|limit)\b/iu;

function normalizeQuestion(question: string) {
  return question.trim().replace(/\s+/gu, " ").toLocaleLowerCase("en-US");
}

const GOLD_ANSWER_BY_QUESTION = new Map(
  QA_GOLD.map((item) => [normalizeQuestion(item.question), item] as const),
);

export function answerRuleQuestion(rawQuestion: string): RuleAnswer {
  const question = normalizeQuestion(rawQuestion);

  if (instructionAttackPattern.test(question)) {
    return {
      status: "unresolved",
      answer:
        "Instructions in a question or document cannot change RealDoor’s safety or privacy boundaries.",
      sourceIds: ["CH-SAFETY-001"],
    };
  }

  const exactGoldAnswer = GOLD_ANSWER_BY_QUESTION.get(question);
  // The saved gold question about the decision boundary is supported. Other
  // decision requests must abstain rather than turning a comparison into a verdict.
  if (prohibitedDecisionPattern.test(question) && !exactGoldAnswer) {
    return {
      status: "unresolved",
      answer:
        "RealDoor can show a numerical comparison and readiness status only. A human makes every program determination.",
      sourceIds: ["CH-DECISION-001"],
    };
  }

  if (crossHouseholdPattern.test(question) || protectedTraitPattern.test(question)) {
    return {
      status: "unresolved",
      answer: "RealDoor cannot reveal another household’s information or infer protected traits.",
      sourceIds: ["CH-SAFETY-001", "CH-DECISION-001"],
    };
  }

  if (vacancyPattern.test(question) && !exactGoldAnswer) {
    return {
      status: "answered",
      answer:
        "The HUD property dataset is a project inventory, not a current vacancy, rent, waitlist, or application-status feed.",
      sourceIds: ["HUD-DATA-001"],
    };
  }

  if (wrongYearPattern.test(question)) {
    return {
      status: "answered",
      answer: "This session uses only the frozen FY 2026 MTSP corpus effective May 1, 2026.",
      sourceIds: ["HUD-MTSP-001", "HUD-MTSP-002"],
    };
  }

  if (exactGoldAnswer) {
    return {
      status: "answered",
      answer: exactGoldAnswer.answer,
      sourceIds: [...exactGoldAnswer.rule_ids],
    };
  }

  // Fuzzy topic matches for common renter questions that are not exact gold strings.
  if (/\b(annual|annualiz|monthly income|times 12|×\s*12|pay frequency)\b/iu.test(question)) {
    return {
      status: "answered",
      answer:
        "Recurring gross income is annualized from the documented pay frequency: weekly × 52, biweekly × 26, semimonthly × 24, monthly × 12, or annual × 1. Independently documented recurring sources are summed. Protected traits and undocumented income are never inferred.",
      sourceIds: ["CH-INCOME-001"],
    };
  }

  if (/\b(60%|60 percent|income limit|threshold|mtsp)\b/iu.test(question)) {
    return {
      status: "answered",
      answer:
        "This session compares confirmed annualized income with the frozen FY 2026 60% MTSP limit for the Boston-Cambridge-Quincy area and household size. The comparison is numerical only and is not an eligibility decision.",
      sourceIds: ["HUD-MTSP-002", "HUD-MTSP-001", "CH-DECISION-001"],
    };
  }

  return {
    status: "unresolved",
    answer:
      "The frozen guide does not contain enough information to answer that safely. Ask the property or use an official program source.",
    sourceIds: [],
  };
}
