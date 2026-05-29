import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import http from "node:http";
import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildCacheKey } from "../src/core/cacheKey.js";
import { parseVisionResponse } from "../src/core/parseVisionResponse.js";
import { loadConfig } from "../src/config/loadConfig.js";
import { analyzeImage } from "../src/core/analyzeImage.js";
import type { LoadedConfig } from "../src/config/loadConfig.js";
import { saveProviderSettings } from "../src/db/secrets.js";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "imgx-test-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("cache keys", () => {
  it("are stable for identical inputs", () => {
    const input = {
      sha256: "abc",
      task: "ocr",
      prompt: "read",
      model: "vision",
      baseURL: "http://localhost",
      promptVersion: "v1",
      imageOptions: { maxWidth: 100 }
    };
    expect(buildCacheKey(input)).toBe(buildCacheKey(input));
  });
});

describe("provider response parsing", () => {
  it("extracts text and usage", () => {
    const parsed = parseVisionResponse({
      choices: [{ message: { content: "hello" } }],
      usage: { prompt_tokens: 3, completion_tokens: 4 }
    }, false);
    expect(parsed.text).toBe("hello");
    expect(parsed.usage.inputTokens).toBe(3);
    expect(parsed.usage.outputTokens).toBe(4);
  });

  it("rejects invalid json in json mode", () => {
    expect(() => parseVisionResponse({ choices: [{ message: { content: "nope" } }] }, true)).toThrow("valid JSON");
  });
});

describe("config loading", () => {
  it("loads provider settings from local sqlite", () => {
    const configPath = path.join(tmpDir, "config.json");
    const dbPath = path.join(tmpDir, "imgx.db");
    fs.writeFileSync(configPath, JSON.stringify({
      provider: { type: "openai-compatible", baseURL: "https://file.example/v1", model: "file-model" },
      database: { path: dbPath }
    }));
    saveProviderSettings(dbPath, {
      baseURL: "https://sqlite.example/v1",
      model: "sqlite-model",
      apiKey: "sk-test"
    });
    const loaded = loadConfig({ config: configPath });
    expect(loaded.config.provider.baseURL).toBe("https://sqlite.example/v1");
    expect(loaded.config.provider.model).toBe("sqlite-model");
    expect(loaded.apiKey).toBe("sk-test");
  });
});

describe("analyzeImage", () => {
  it("sends a local image to an OpenAI-compatible provider and caches the result", async () => {
    let calls = 0;
    const server = http.createServer((req, res) => {
      calls++;
      expect(req.url).toBe("/v1/chat/completions");
      let body = "";
      req.on("data", (chunk) => {
        body += String(chunk);
      });
      req.on("end", () => {
        const parsed = JSON.parse(body);
        expect(parsed.messages[0].content[1].image_url.url).toMatch(/^data:image\/png;base64,/);
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({
          choices: [{ message: { content: JSON.stringify({ summary: "white square", visible_text: [], observations: ["blank"], limitations: [] }) } }],
          usage: { prompt_tokens: 10, completion_tokens: 5 }
        }));
      });
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("server failed");

    const imagePath = path.join(tmpDir, "image.png");
    await sharp({
      create: { width: 8, height: 8, channels: 3, background: { r: 255, g: 255, b: 255 } }
    }).png().toFile(imagePath);

    const loaded: LoadedConfig = {
      config: {
        provider: {
          type: "openai-compatible",
          baseURL: `http://127.0.0.1:${address.port}/v1`,
          model: "mock-vision"
        },
        image: {
          maxSizeMB: 20,
          autoResize: true,
          maxWidth: 2000,
          maxHeight: 2000,
          stripExif: true,
          allowedExtensions: [".png", ".jpg", ".jpeg", ".webp"]
        },
        output: { defaultFormat: "text" },
        cache: { enabled: true, ttlDays: 30 },
        database: { path: path.join(tmpDir, "imgx.db") }
      },
      apiKey: "sk-test",
      timeoutMs: 5000
    };

    const first = await analyzeImage(loaded, { imagePath, task: "describe", json: true });
    const second = await analyzeImage(loaded, { imagePath, task: "describe", json: true });
    expect(first.cached).toBe(false);
    expect(second.cached).toBe(true);
    expect(calls).toBe(1);
    server.close();
  });
});
