import fs from "node:fs";
import path from "node:path";
import { ConfigSchema, type CliConfigOverrides, type ImgxConfig } from "./schema.js";
import { expandHome, projectConfigPath, userConfigPath } from "../utils/paths.js";
import { ImgxError } from "../errors/ImgxError.js";
import { readProviderSettings } from "../db/secrets.js";

export type LoadedConfig = {
  config: ImgxConfig;
  configPath?: string;
  apiKey?: string;
  timeoutMs: number;
};

function readJsonIfExists(filePath: string): Record<string, unknown> {
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as Record<string, unknown>;
}

function mergeConfig(...values: Record<string, unknown>[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const value of values) {
    for (const [key, item] of Object.entries(value)) {
      if (item && typeof item === "object" && !Array.isArray(item)) {
        out[key] = mergeConfig((out[key] as Record<string, unknown>) ?? {}, item as Record<string, unknown>);
      } else if (item !== undefined) {
        out[key] = item;
      }
    }
  }
  return out;
}

export function loadConfig(overrides: CliConfigOverrides = {}): LoadedConfig {
  const explicitConfigPath = overrides.config ? path.resolve(overrides.config) : undefined;
  const userPath = userConfigPath();
  const projectPath = projectConfigPath();
  const userConfig = readJsonIfExists(userPath);
  const projectConfig = explicitConfigPath ? readJsonIfExists(explicitConfigPath) : readJsonIfExists(projectPath);
  const cliConfig: Record<string, unknown> = {};

  if (overrides.baseURL || overrides.model) {
    cliConfig.provider = {
      baseURL: overrides.baseURL,
      model: overrides.model
    };
  }
  if (overrides.dbPath) cliConfig.database = { path: overrides.dbPath };
  if (overrides.maxImageMB) cliConfig.image = { maxSizeMB: overrides.maxImageMB };

  const parsed = ConfigSchema.parse(mergeConfig(userConfig, projectConfig, cliConfig));
  parsed.database.path = expandHome(parsed.database.path);
  const stored = readProviderSettings(parsed.database.path);
  if (stored.baseURL) parsed.provider.baseURL = stored.baseURL;
  if (stored.model) parsed.provider.model = stored.model;
  const apiKey = stored.apiKey;
  const timeoutMs = overrides.timeoutMs ?? 120000;

  return {
    config: parsed,
    configPath: explicitConfigPath ?? (fs.existsSync(projectPath) ? projectPath : fs.existsSync(userPath) ? userPath : undefined),
    apiKey,
    timeoutMs
  };
}

export function requireProviderConfig(loaded: LoadedConfig): { baseURL: string; model: string; apiKey: string } {
  const { config, apiKey } = loaded;
  if (!config.provider.baseURL) {
    throw new ImgxError("CONFIG_INVALID_BASE_URL", "Provider baseURL is missing.", {
      hint: "Run imgx set --base-url ... --model ... --api-key ..."
    });
  }
  if (!config.provider.model) {
    throw new ImgxError("CONFIG_MODEL_MISSING", "Provider model is missing.", {
      hint: "Run imgx set --base-url ... --model ... --api-key ..."
    });
  }
  if (!apiKey) {
    throw new ImgxError("CONFIG_MISSING_API_KEY", "Provider API key is missing from local SQLite.", {
      hint: "Run imgx set --api-key ... before running imgx."
    });
  }
  return { baseURL: config.provider.baseURL, model: config.provider.model, apiKey };
}
