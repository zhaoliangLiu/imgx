import { Command } from "commander";
import { loadConfig } from "../../config/loadConfig.js";
import { openDb } from "../../db/client.js";
import { Repositories } from "../../db/repositories.js";
import { writeJson } from "../../output/json.js";

export function historyCommand(): Command {
  return new Command("history")
    .description("Show analysis history")
    .option("--limit <n>", "Number of records", "20")
    .option("--json", "Output JSON")
    .action((options, command) => {
      const merged = command.optsWithGlobals();
      const loaded = loadConfig(merged);
      const db = openDb(loaded.config.database.path);
      const rows = new Repositories(db).recentAnalyses(Number(merged.limit));
      db.close();
      if (merged.json) writeJson({ ok: true, items: rows });
      else {
        for (const row of rows) process.stdout.write(`${row.created_at} ${row.id} ${row.task} ${row.status} ${row.image_path}\n`);
      }
    });
}
