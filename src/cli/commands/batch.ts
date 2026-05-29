import { Command } from "commander";
import { runBatch } from "../../batch/runner.js";
import { loadForCommand } from "../shared.js";
import { ImgxError } from "../../errors/ImgxError.js";

export function batchCommand(): Command {
  return new Command("batch")
    .description("Run task on multiple images")
    .argument("<pattern>")
    .option("--task <task>", "Task", "describe")
    .option("--prompt <text>", "Additional prompt")
    .option("--jsonl <path>", "Write JSONL to file")
    .option("--concurrency <n>", "Concurrency", "3")
    .option("--resume", "Skip successful items already present in --jsonl")
    .option("--continue-on-error", "Continue after item failures")
    .option("--no-cache", "Disable cache")
    .option("--limit <n>", "Limit number of images")
    .action(async (pattern, options, command) => {
      const merged = command.optsWithGlobals();
      const { loaded, logger } = loadForCommand(merged);
      const result = await runBatch(loaded, {
        pattern,
        task: merged.task,
        prompt: merged.prompt,
        jsonl: merged.jsonl,
        concurrency: Number(merged.concurrency),
        continueOnError: Boolean(merged.continueOnError),
        noCache: Boolean(merged.noCache),
        resume: Boolean(merged.resume),
        limit: merged.limit ? Number(merged.limit) : undefined,
        onProgress: (message) => logger.info(message)
      });
      if (result.failed > 0) {
        throw new ImgxError("BATCH_PARTIAL_FAILED", `Batch completed with ${result.failed} failed item(s).`);
      }
    });
}
