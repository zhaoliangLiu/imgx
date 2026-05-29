import { ImgxError } from "../errors/ImgxError.js";

export type ParsedVisionResponse = {
  text: string;
  json?: unknown;
  usage: {
    inputTokens?: number | null;
    outputTokens?: number | null;
  };
};

function extractContent(raw: any): string | undefined {
  const content = raw?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((part) => (typeof part?.text === "string" ? part.text : "")).join("");
  }
  return undefined;
}

export function parseVisionResponse(raw: unknown, expectJson: boolean): ParsedVisionResponse {
  const text = extractContent(raw);
  if (!text) {
    throw new ImgxError("PROVIDER_INVALID_RESPONSE", "Provider response did not contain message content.");
  }
  let parsedJson: unknown;
  if (expectJson) {
    const trimmed = text.trim().replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
    try {
      parsedJson = JSON.parse(trimmed);
    } catch {
      throw new ImgxError("PROVIDER_INVALID_RESPONSE", "Provider response was not valid JSON.");
    }
  }
  const anyRaw = raw as any;
  return {
    text,
    json: parsedJson,
    usage: {
      inputTokens: anyRaw?.usage?.prompt_tokens ?? anyRaw?.usage?.input_tokens ?? null,
      outputTokens: anyRaw?.usage?.completion_tokens ?? anyRaw?.usage?.output_tokens ?? null
    }
  };
}

