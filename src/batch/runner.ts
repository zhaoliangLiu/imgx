import fs from "node:fs";
import fg from "fast-glob";
import { analyzeImage } from "../core/analyzeImage.js";
import type { LoadedConfig } from "../config/loadConfig.js";
import { toImgxError } from "../errors/ImgxError.js";

export async function runBatch(
  loaded: LoadedConfig,
  options: {
    pattern: string;
    task: string;
    prompt?: string;
    jsonl?: string;
    concurrency: number;
    continueOnError: boolean;
    noCache: boolean;
    resume: boolean;
    limit?: number;
    onProgress?: (message: string) => void;
  }
): Promise<{ total: number; succeeded: number; failed: number }> {
  let matches = (await fg(options.pattern, { onlyFiles: true, absolute: false })).slice(0, options.limit);
  if (matches.length === 0) {
    const { ImgxError } = await import("../errors/ImgxError.js");
    throw new ImgxError("BATCH_NO_MATCH", `No images matched pattern: ${options.pattern}`);
  }
  if (options.resume && options.jsonl && fs.existsSync(options.jsonl)) {
    const completed = new Set(
      fs.readFileSync(options.jsonl, "utf8")
        .split("\n")
        .filter(Boolean)
        .flatMap((line) => {
          try {
            const item = JSON.parse(line) as { ok?: boolean; path?: string };
            return item.ok && item.path ? [item.path] : [];
          } catch {
            return [];
          }
        })
    );
    matches = matches.filter((item) => !completed.has(item));
  }
  if (matches.length === 0) return { total: 0, succeeded: 0, failed: 0 };
  const out = options.jsonl ? fs.createWriteStream(options.jsonl, { flags: "a" }) : process.stdout;
  let index = 0;
  let succeeded = 0;
  let failed = 0;

  async function worker(): Promise<void> {
    while (index < matches.length) {
      const current = matches[index++]!;
      try {
        const result = await analyzeImage(loaded, {
          imagePath: current,
          task: options.task,
          question: options.prompt,
          json: true,
          noCache: options.noCache
        });
        succeeded++;
        out.write(`${JSON.stringify({ ok: true, path: current, analysis_id: result.analysis_id, result: result.result })}\n`);
      } catch (error) {
        failed++;
        const imgxError = toImgxError(error);
        out.write(`${JSON.stringify({ ok: false, path: current, error: { code: imgxError.code, message: imgxError.message } })}\n`);
        if (!options.continueOnError) throw imgxError;
      } finally {
        options.onProgress?.(`batch ${succeeded + failed}/${matches.length} succeeded=${succeeded} failed=${failed}`);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.max(1, options.concurrency) }, () => worker()));
  if (options.jsonl) await new Promise<void>((resolve) => (out as fs.WriteStream).end(resolve));
  return { total: matches.length, succeeded, failed };
}
