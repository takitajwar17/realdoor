import type { RulePack } from "./domain";
import type { RuleAnswer } from "./rules";

export function sanitizeRuleAnswer(
  result: { status: "answered" | "unresolved"; answer: string; sourceIds: string[] },
  rulePack: RulePack,
): RuleAnswer {
  const allowed = new Set(rulePack.sources.map((source) => source.id));
  const sourceIds = [...new Set(result.sourceIds.filter((id) => allowed.has(id)))];

  if (result.status === "answered" && sourceIds.length === 0) {
    return { status: "unresolved", answer: result.answer, sourceIds: [] };
  }
  if (result.status === "unresolved") {
    return { status: "unresolved", answer: result.answer, sourceIds: [] };
  }
  return { status: "answered", answer: result.answer, sourceIds };
}
