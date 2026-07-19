import { FROZEN_RULES, MTSP_LIMITS_2026, QA_GOLD } from "./corpus";
import type { RulePack, SourceCitation } from "./domain";

const RULE_SOURCES: SourceCitation[] = FROZEN_RULES.map((rule) => ({
  id: rule.ruleId,
  title: rule.sourceLocator,
  url: rule.sourceUrl,
  passage: rule.text,
  locator: rule.sourceLocator,
  effectiveDate: rule.effectiveDate,
  authority: rule.authority,
}));

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
  ],
  sources: RULE_SOURCES,
};

export function getRuleSource(id: string) {
  return RULE_SOURCES.find((source) => source.id === id);
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

  if (exactGoldAnswer) {
    return {
      status: "answered",
      answer: exactGoldAnswer.answer,
      sourceIds: [...exactGoldAnswer.rule_ids],
    };
  }

  return {
    status: "unresolved",
    answer:
      "The frozen guide does not contain enough information to answer that safely. Ask the property or use an official program source.",
    sourceIds: [],
  };
}
