import { Command } from "commander";
import { analyzeImage } from "../../core/analyzeImage.js";
import { writeJson } from "../../output/json.js";
import { resultToText } from "../../output/text.js";
import { loadForCommand } from "../shared.js";

export function askCommand(): Command {
  return new Command("ask")
    .description("Ask a question about an image")
    .argument("<image>")
    .argument("<question>")
    .option("--task <task>", "Task hint", "general")
    .option("--json", "Output JSON")
    .option("--no-cache", "Disable cache")
    .option("--save-raw", "Save raw provider response")
    .option("--timeout <ms>", "Request timeout")
    .action(async (image, question, options, command) => {
      const merged = command.optsWithGlobals();
      const { loaded } = loadForCommand(merged);
      const result = await analyzeImage(loaded, {
        imagePath: image,
        task: merged.task,
        question,
        json: Boolean(merged.json),
        noCache: Boolean(merged.noCache),
        saveRaw: Boolean(merged.saveRaw)
      });
      merged.json ? writeJson(result) : process.stdout.write(`${resultToText(result)}\n`);
    });
}

export function describeCommand(): Command {
  return new Command("describe")
    .description("Describe an image")
    .argument("<image>")
    .option("--for <task>", "Description target", "describe")
    .option("--json", "Output JSON")
    .option("--no-cache", "Disable cache")
    .option("--timeout <ms>", "Request timeout")
    .action(async (image, options, command) => {
      const merged = command.optsWithGlobals();
      const { loaded } = loadForCommand(merged);
      const result = await analyzeImage(loaded, {
        imagePath: image,
        task: merged.for,
        json: Boolean(merged.json),
        noCache: Boolean(merged.noCache)
      });
      merged.json ? writeJson(result) : process.stdout.write(`${resultToText(result)}\n`);
    });
}

export function ocrCommand(): Command {
  return new Command("ocr")
    .description("Extract text from an image")
    .argument("<image>")
    .option("--json", "Output JSON")
    .option("--no-cache", "Disable cache")
    .option("--timeout <ms>", "Request timeout")
    .action(async (image, options, command) => {
      const merged = command.optsWithGlobals();
      const { loaded } = loadForCommand(merged);
      const result = await analyzeImage(loaded, {
        imagePath: image,
        task: "ocr",
        json: Boolean(merged.json),
        noCache: Boolean(merged.noCache)
      });
      merged.json ? writeJson(result) : process.stdout.write(`${resultToText(result)}\n`);
    });
}
