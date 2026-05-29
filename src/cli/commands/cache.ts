import { Command } from "commander";
import { loadConfig } from "../../config/loadConfig.js";
import { openDb } from "../../db/client.js";
import { Repositories } from "../../db/repositories.js";
import { writeJson } from "../../output/json.js";

export function cacheCommand(): Command {
  const command = new Command("cache").description("Manage cache");
  command.command("clear").description("Clear analysis cache").option("--json", "Output JSON").action((options, command) => {
    const merged = command.optsWithGlobals();
    const loaded = loadConfig(merged);
    const db = openDb(loaded.config.database.path);
    const deleted = new Repositories(db).clearCache();
    db.close();
    if (merged.json) writeJson({ ok: true, deleted });
    else process.stdout.write(`Deleted ${deleted} cached analyses\n`);
  });
  return command;
}
