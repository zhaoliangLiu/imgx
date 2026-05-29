import fs from "node:fs";
import { Command } from "commander";
import { loadConfig, requireProviderConfig } from "../../config/loadConfig.js";
import { openDb } from "../../db/client.js";
import { writeJson } from "../../output/json.js";
import { defaultCacheDir } from "../../utils/paths.js";
import sharp from "sharp";
import { toDataUrl } from "../../image/dataUrl.js";
import { callOpenAICompatibleVision } from "../../providers/openaiCompatibleVision.js";
import { parseVisionResponse } from "../../core/parseVisionResponse.js";

export function doctorCommand(version: string): Command {
  return new Command("doctor")
    .description("Check local state and provider connectivity")
    .option("--json", "Output JSON")
    .action(async (options, command) => {
      const merged = command.optsWithGlobals();
      const loaded = loadConfig(merged);
      const checks: Array<Record<string, unknown>> = [];
      checks.push({ name: "node_version", ok: true, value: process.version });
      checks.push({ name: "imgx_version", ok: true, value: version });
      checks.push({ name: "config_found", ok: Boolean(loaded.configPath), path: loaded.configPath });
      try {
        const db = openDb(loaded.config.database.path);
        db.close();
        checks.push({ name: "sqlite_writable", ok: true, path: loaded.config.database.path });
      } catch (error) {
        checks.push({ name: "sqlite_writable", ok: false, message: error instanceof Error ? error.message : String(error) });
      }
      try {
        const provider = requireProviderConfig(loaded);
        checks.push({ name: "api_key", ok: true, source: "local_sqlite" });
        checks.push({ name: "provider_config", ok: true, baseURL: provider.baseURL, model: provider.model });
        const png = await sharp({
          create: {
            width: 32,
            height: 32,
            channels: 3,
            background: { r: 255, g: 255, b: 255 }
          }
        }).png().toBuffer();
        const started = Date.now();
        const providerResult = await callOpenAICompatibleVision({
          baseURL: provider.baseURL,
          model: provider.model,
          apiKey: provider.apiKey,
          prompt: "Reply with OK if you can see this test image.",
          dataUrl: toDataUrl(png, "image/png"),
          timeoutMs: loaded.timeoutMs
        });
        parseVisionResponse(providerResult.raw, false);
        checks.push({ name: "provider_test", ok: true, latency_ms: Date.now() - started });
      } catch (error) {
        checks.push({ name: "provider_test", ok: false, message: error instanceof Error ? error.message : String(error) });
      }
      const cacheDir = defaultCacheDir();
      try {
        fs.mkdirSync(cacheDir, { recursive: true });
        fs.accessSync(cacheDir, fs.constants.W_OK);
        checks.push({ name: "cache_writable", ok: true, path: cacheDir });
      } catch (error) {
        checks.push({ name: "cache_writable", ok: false, message: error instanceof Error ? error.message : String(error) });
      }
      const result = { ok: checks.every((check) => check.ok), checks };
      if (merged.json) writeJson(result);
      else {
        for (const check of checks) process.stdout.write(`${check.ok ? "ok" : "fail"} ${check.name}${check.value ? ` ${check.value}` : ""}\n`);
      }
      if (!result.ok) process.exitCode = 1;
    });
}
