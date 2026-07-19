type ConfirmableFact = {
  key: string;
  status: string;
  confidence: number | null;
};

export function selectClearFactsForConfirmation<T extends ConfirmableFact>(
  facts: T[],
  conflicts: readonly string[],
) {
  const conflictKeys = new Set(conflicts);
  const bestFactByKey = new Map<string, T>();

  for (const fact of facts) {
    if (
      fact.status !== "extracted" ||
      fact.confidence === null ||
      fact.confidence < 900 ||
      conflictKeys.has(fact.key)
    ) {
      continue;
    }

    const current = bestFactByKey.get(fact.key);
    if (!current || (current.confidence ?? 0) < fact.confidence) {
      bestFactByKey.set(fact.key, fact);
    }
  }

  return [...bestFactByKey.values()];
}
