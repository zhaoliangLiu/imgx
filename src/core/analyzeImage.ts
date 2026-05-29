import { loadImageFile } from "../image/loadImage.js";
import { normalizeImage } from "../image/normalizeImage.js";
import { imageRecord } from "../image/metadata.js";
import { toDataUrl } from "../image/dataUrl.js";
import { buildCacheKey } from "./cacheKey.js";
import { buildPrompt } from "../prompts/templates.js";
import { PROMPT_VERSION } from "../prompts/versions.js";
import { callOpenAICompatibleVision } from "../providers/openaiCompatibleVision.js";
import { parseVisionResponse } from "./parseVisionResponse.js";
import type { LoadedConfig } from "../config/loadConfig.js";
import { requireProviderConfig } from "../config/loadConfig.js";
import { openDb } from "../db/client.js";
import { Repositories } from "../db/repositories.js";
import { toImgxError } from "../errors/ImgxError.js";

export type AnalyzeOptions = {
  imagePath: string;
  task: string;
  question?: string;
  json: boolean;
  noCache?: boolean;
  saveRaw?: boolean;
};

export async function analyzeImage(loaded: LoadedConfig, options: AnalyzeOptions): Promise<Record<string, unknown>> {
  const db = openDb(loaded.config.database.path);
  const repos = new Repositories(db);
  try {
    const source = loadImageFile(options.imagePath, loaded.config.image);
    const normalized = await normalizeImage(source.buffer, loaded.config.image);
    const image = repos.upsertImage(imageRecord(source.absPath, source.sizeBytes, normalized));
    const provider = requireProviderConfig(loaded);
    const prompt = buildPrompt({ task: options.task, question: options.question, json: options.json });
    const cacheKey = buildCacheKey({
      sha256: image.sha256,
      task: options.task,
      prompt,
      model: provider.model,
      baseURL: provider.baseURL,
      promptVersion: PROMPT_VERSION,
      imageOptions: loaded.config.image
    });
    const cached = loaded.config.cache.enabled && !options.noCache ? repos.findCached(cacheKey) : undefined;
    if (cached) {
      return {
        ok: true,
        analysis_id: cached.id,
        task: options.task,
        question: options.question,
        image: publicImage(image),
        result: cached.resultJson ?? { answer: cached.resultText },
        provider: { model: provider.model },
        cached: true,
        usage: { latency_ms: 0, input_tokens: null, output_tokens: null }
      };
    }

    const dataUrl = toDataUrl(normalized.buffer, normalized.mime);
    const providerResult = await callOpenAICompatibleVision({
      baseURL: provider.baseURL,
      model: provider.model,
      apiKey: provider.apiKey,
      prompt,
      dataUrl,
      timeoutMs: loaded.timeoutMs
    });
    const parsed = parseVisionResponse(providerResult.raw, options.json);
    const analysis = repos.saveAnalysis({
      imageId: image.id,
      task: options.task,
      prompt,
      model: provider.model,
      baseURL: provider.baseURL,
      promptVersion: PROMPT_VERSION,
      cacheKey,
      resultText: parsed.text,
      resultJson: parsed.json,
      rawResponse: options.saveRaw ? providerResult.raw : undefined,
      status: "succeeded"
    });
    repos.saveRequest({
      analysisId: analysis.id,
      status: "succeeded",
      latencyMs: providerResult.latencyMs,
      inputTokens: parsed.usage.inputTokens,
      outputTokens: parsed.usage.outputTokens
    });
    return {
      ok: true,
      analysis_id: analysis.id,
      task: options.task,
      question: options.question,
      image: publicImage(image),
      result: parsed.json ?? { answer: parsed.text },
      provider: { model: provider.model },
      cached: false,
      usage: {
        latency_ms: providerResult.latencyMs,
        input_tokens: parsed.usage.inputTokens,
        output_tokens: parsed.usage.outputTokens
      }
    };
  } catch (error) {
    const imgxError = toImgxError(error);
    repos.saveRequest({ status: "failed" });
    throw imgxError;
  } finally {
    db.close();
  }
}

function publicImage(image: { path: string; sha256: string; mime?: string; width?: number; height?: number; sizeBytes: number }): Record<string, unknown> {
  return {
    path: image.path,
    sha256: image.sha256,
    mime: image.mime,
    width: image.width,
    height: image.height,
    size_bytes: image.sizeBytes
  };
}
