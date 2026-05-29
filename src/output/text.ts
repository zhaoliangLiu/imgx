export function resultToText(result: Record<string, unknown>): string {
  const value = result.result as any;
  if (typeof value?.answer === "string") return value.answer;
  if (typeof value?.summary === "string") return value.summary;
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

