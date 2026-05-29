import { Command } from "commander";
import { loadConfig } from "../../config/loadConfig.js";
import { saveProviderSettings, deleteApiKey, deleteProviderSettings, readProviderSettings } from "../../db/secrets.js";
import { writeJson } from "../../output/json.js";
import { redactSecret } from "../../utils/redact.js";
import { ImgxError } from "../../errors/ImgxError.js";
import { userConfigPath } from "../../utils/paths.js";
import fs from "node:fs";

function scrubProviderFromUserConfig(): void {
  const configPath = userConfigPath();
  if (!fs.existsSync(configPath)) return;
  const parsed = JSON.parse(fs.readFileSync(configPath, "utf8")) as Record<string, unknown>;
  if (!("provider" in parsed)) return;
  delete parsed.provider;
  fs.writeFileSync(configPath, `${JSON.stringify(parsed, null, 2)}\n`, { mode: 0o600 });
}

export function setCommand(): Command {
  return new Command("set")
    .description("Save provider settings to local SQLite")
    .option("--base-url <url>", "OpenAI-compatible base URL")
    .option("--model <model>", "Vision model name")
    .option("--api-key <key>", "Provider API key stored locally in SQLite")
    .option("--json", "Output JSON")
    .action((options, command) => {
      const merged = command.optsWithGlobals();
      if (!merged.baseUrl && !merged.model && !merged.apiKey) {
        throw new ImgxError("ARGUMENT_ERROR", "Nothing to set.", {
          hint: "Use imgx set --base-url ... --model ... --api-key ..."
        });
      }
      const loaded = loadConfig(merged);
      saveProviderSettings(loaded.config.database.path, {
        baseURL: merged.baseUrl,
        model: merged.model,
        apiKey: merged.apiKey
      });
      scrubProviderFromUserConfig();
      const stored = readProviderSettings(loaded.config.database.path);
      const result = {
        ok: true,
        db_path: loaded.config.database.path,
        provider: {
          baseURL: stored.baseURL,
          model: stored.model,
          apiKey: stored.apiKey ? redactSecret(stored.apiKey) : undefined
        }
      };
      if (merged.json) writeJson(result);
      else process.stdout.write(`Saved provider settings to ${loaded.config.database.path}\n`);
    });
}

export function unsetCommand(): Command {
  const command = new Command("unset").description("Delete saved local settings");
  command
    .command("api-key")
    .description("Delete saved provider API key from local SQLite")
    .option("--json", "Output JSON")
    .action((options, subcommand) => {
      const merged = subcommand.optsWithGlobals();
      const loaded = loadConfig(merged);
      const deleted = deleteApiKey(loaded.config.database.path);
      if (merged.json) writeJson({ ok: true, deleted });
      else process.stdout.write(deleted ? "Deleted saved API key\n" : "No saved API key found\n");
    });
  command
    .command("provider")
    .description("Delete saved provider baseURL, model, and API key")
    .option("--json", "Output JSON")
    .action((options, subcommand) => {
      const merged = subcommand.optsWithGlobals();
      const loaded = loadConfig(merged);
      const deleted = deleteProviderSettings(loaded.config.database.path);
      if (merged.json) writeJson({ ok: true, deleted });
      else process.stdout.write(`Deleted ${deleted} saved provider setting(s)\n`);
    });
  return command;
}
