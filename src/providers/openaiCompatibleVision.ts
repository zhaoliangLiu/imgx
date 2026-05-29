import { request } from "undici";
import { ImgxError } from "../errors/ImgxError.js";
import { buildVisionRequest } from "../core/buildVisionRequest.js";
import type { VisionProviderResult, VisionRequestInput } from "./types.js";
import { redactText } from "../utils/redact.js";

function endpoint(baseURL: string): string {
  return `${baseURL.replace(/\/$/, "")}/chat/completions`;
}

function mapStatus(statusCode: number, body: string): ImgxError {
  const detail = body ? ` ${redactText(body).slice(0, 500)}` : "";
  if (statusCode === 401 || statusCode === 403) return new ImgxError("PROVIDER_UNAUTHORIZED", `Provider rejected authentication.${detail}`);
  if (statusCode === 429) return new ImgxError("PROVIDER_RATE_LIMITED", `Provider rate limited the request.${detail}`);
  if (statusCode === 400) {
    const code = /image/i.test(body) ? "PROVIDER_UNSUPPORTED_IMAGE" : "PROVIDER_BAD_REQUEST";
    return new ImgxError(code, `Provider rejected the request.${detail}`);
  }
  return new ImgxError("PROVIDER_BAD_REQUEST", `Provider returned HTTP ${statusCode}.${detail}`);
}

export async function callOpenAICompatibleVision(input: VisionRequestInput): Promise<VisionProviderResult> {
  const started = Date.now();
  const body = JSON.stringify(buildVisionRequest(input));
  try {
    const response = await request(endpoint(input.baseURL), {
      method: "POST",
      body,
      bodyTimeout: input.timeoutMs,
      headersTimeout: input.timeoutMs,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${input.apiKey}`
      }
    });
    const text = await response.body.text();
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw mapStatus(response.statusCode, text);
    }
    return { raw: JSON.parse(text), latencyMs: Date.now() - started };
  } catch (error) {
    if (error instanceof ImgxError) throw error;
    const message = error instanceof Error ? error.message : String(error);
    if (/timeout|aborted/i.test(message)) {
      throw new ImgxError("PROVIDER_TIMEOUT", "Provider request timed out.", { cause: error });
    }
    throw new ImgxError("PROVIDER_INVALID_RESPONSE", `Provider request failed: ${message}`, { cause: error });
  }
}
