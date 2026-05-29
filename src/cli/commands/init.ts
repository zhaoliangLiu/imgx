import fs from "node:fs";
import path from "node:path";
import { Command } from "commander";
import { openDb } from "../../db/client.js";
import { defaultCacheDir, userConfigPath } from "../../utils/paths.js";
import { writeJson } from "../../output/json.js";

export function initCommand(): Command {
  return new Command("init")
    .description("Initialize imgx config")
    .option("--base-url <url>", "OpenAI-compatible base URL")
    .option("--model <model>", "Vision model name")
    .option("--api-key-env <name>", "Environment variable that stores the API key", "IMGX_API_KEY")
    .option("--json", "Output JSON")
    .action((options, command) => {
      const merged = command.optsWithGlobals();
      const configPath = userConfigPath();
      fs.mkdirSync(path.dirname(configPath), { recursive: true });
      const dbPath = path.join(process.env.HOME ?? "~", ".imgx", "imgx.db");
      const cacheDir = defaultCacheDir();
      fs.mkdirSync(cacheDir, { recursive: true });
      const config = {
        provider: {
          type: "openai-compatible",
          baseURL: merged.baseUrl,
          model: merged.model,
          apiKeyEnv: merged.apiKeyEnv
        },
        database: { path: dbPath },
        cache: { enabled: true, ttlDays: 30 }
      };
      fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
      const db = openDb(dbPath);
      db.close();
      if (merged.json) {
        writeJson({ ok: true, config_path: configPath, db_path: dbPath, cache_dir: cacheDir });
      } else {
        process.stdout.write(`Created ${configPath}\nCreated ${dbPath}\nCreated ${cacheDir}\n`);
      }
    });
}
