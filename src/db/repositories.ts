import { nanoid } from "nanoid";
import type { DbClient } from "./client.js";

export type StoredImage = {
  id: string;
  sha256: string;
  path: string;
  mime?: string;
  width?: number;
  height?: number;
  sizeBytes: number;
};

export type StoredAnalysis = {
  id: string;
  imageId: string;
  task: string;
  prompt?: string;
  model: string;
  baseURL: string;
  promptVersion: string;
  cacheKey: string;
  resultText?: string;
  resultJson?: unknown;
  rawResponse?: unknown;
  status: "succeeded" | "failed";
  errorCode?: string;
  errorMessage?: string;
};

export class Repositories {
  constructor(private readonly db: DbClient) {}

  upsertImage(input: Omit<StoredImage, "id">): StoredImage {
    const existing = this.db.prepare("SELECT * FROM images WHERE sha256 = ? AND path = ? LIMIT 1").get(input.sha256, input.path) as
      | { id: string }
      | undefined;
    const id = existing?.id ?? `img_${nanoid()}`;
    this.db.prepare(
      `INSERT OR REPLACE INTO images (id, sha256, path, mime, width, height, size_bytes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT created_at FROM images WHERE id = ?), ?))`
    ).run(id, input.sha256, input.path, input.mime, input.width, input.height, input.sizeBytes, id, new Date().toISOString());
    return { id, ...input };
  }

  findCached(cacheKey: string): (StoredAnalysis & { imagePath: string }) | undefined {
    const row = this.db.prepare(
      `SELECT a.*, i.path AS image_path FROM analyses a
       JOIN images i ON i.id = a.image_id
       WHERE a.cache_key = ? AND a.status = 'succeeded' LIMIT 1`
    ).get(cacheKey) as Record<string, unknown> | undefined;
    if (!row) return undefined;
    return {
      id: String(row.id),
      imageId: String(row.image_id),
      imagePath: String(row.image_path),
      task: String(row.task),
      prompt: row.prompt ? String(row.prompt) : undefined,
      model: String(row.model),
      baseURL: String(row.base_url),
      promptVersion: String(row.prompt_version),
      cacheKey: String(row.cache_key),
      resultText: row.result_text ? String(row.result_text) : undefined,
      resultJson: row.result_json ? JSON.parse(String(row.result_json)) : undefined,
      rawResponse: row.raw_response ? JSON.parse(String(row.raw_response)) : undefined,
      status: "succeeded"
    };
  }

  saveAnalysis(input: Omit<StoredAnalysis, "id">): StoredAnalysis {
    const id = `ana_${nanoid()}`;
    this.db.prepare(
      `INSERT OR REPLACE INTO analyses
       (id, image_id, task, prompt, model, base_url, prompt_version, cache_key, result_text, result_json, raw_response, status, error_code, error_message, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      input.imageId,
      input.task,
      input.prompt,
      input.model,
      input.baseURL,
      input.promptVersion,
      input.cacheKey,
      input.resultText,
      input.resultJson === undefined ? undefined : JSON.stringify(input.resultJson),
      input.rawResponse === undefined ? undefined : JSON.stringify(input.rawResponse),
      input.status,
      input.errorCode,
      input.errorMessage,
      new Date().toISOString()
    );
    return { id, ...input };
  }

  saveRequest(input: { analysisId?: string; status: string; latencyMs?: number; inputTokens?: number | null; outputTokens?: number | null }): void {
    this.db.prepare(
      "INSERT INTO requests (id, analysis_id, status, latency_ms, input_tokens, output_tokens, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(`req_${nanoid()}`, input.analysisId, input.status, input.latencyMs, input.inputTokens, input.outputTokens, new Date().toISOString());
  }

  recentAnalyses(limit: number): Array<Record<string, unknown>> {
    return this.db.prepare(
      `SELECT a.id, a.task, i.path AS image_path, a.model, a.status, a.error_code, a.created_at
       FROM analyses a JOIN images i ON i.id = a.image_id
       ORDER BY a.created_at DESC LIMIT ?`
    ).all(limit) as Array<Record<string, unknown>>;
  }

  clearCache(): number {
    const result = this.db.prepare("DELETE FROM analyses").run();
    return result.changes;
  }
}

