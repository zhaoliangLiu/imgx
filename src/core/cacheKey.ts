import crypto from "node:crypto";

export function buildCacheKey(input: {
  sha256: string;
  task: string;
  prompt: string;
  model: string;
  baseURL: string;
  promptVersion: string;
  imageOptions: unknown;
}): string {
  return crypto.createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

