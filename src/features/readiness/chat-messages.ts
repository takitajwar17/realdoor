export type ReadinessChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sourceIds?: string[];
};

/** Flatten persisted Q&A rows into chat bubbles (oldest first). Safe for server components. */
export function toChatMessages(
  questions: Array<{
    id: string;
    sourceIds: string;
    payload: { question: string; answer: string };
  }>,
): ReadinessChatMessage[] {
  return [...questions].reverse().flatMap((question) => {
    let sourceIds: string[] = [];
    try {
      const parsed = JSON.parse(question.sourceIds) as unknown;
      if (Array.isArray(parsed)) {
        sourceIds = parsed.filter((value): value is string => typeof value === "string");
      }
    } catch {
      sourceIds = [];
    }

    return [
      {
        id: `${question.id}-user`,
        role: "user" as const,
        content: question.payload.question,
      },
      {
        id: `${question.id}-assistant`,
        role: "assistant" as const,
        content: question.payload.answer,
        sourceIds,
      },
    ];
  });
}
