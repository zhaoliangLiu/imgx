import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { askCommand, describeCommand, ocrCommand } from "./commands/analyze.js";
import { doctorCommand } from "./commands/doctor.js";
import { historyCommand } from "./commands/history.js";
import { cacheCommand } from "./commands/cache.js";
import { batchCommand } from "./commands/batch.js";
import { setCommand, unsetCommand } from "./commands/set.js";
import { errorJson, writeJson } from "../output/json.js";
import { analyzeImage } from "../core/analyzeImage.js";
import { resultToText } from "../output/text.js";
import { loadForCommand } from "./shared.js";
import { toImgxError } from "../errors/ImgxError.js";
import { ImgxError } from "../errors/ImgxError.js";
import { exitCodeFor } from "../errors/exitCodes.js";

const VERSION = "0.1.0";

const program = new Command();
program
  .name("imgx")
  .description("A CLI image bridge for text-only LLMs.")
  .version(VERSION)
  .option("--config <path>", "Use custom config file")
  .option("--json", "Output JSON")
  .option("--quiet", "Suppress non-result output")
  .option("--verbose", "Show more logs")
  .option("--debug", "Show debug logs with secrets redacted");

program
  .argument("[image]", "Image path for shorthand ask")
  .argument("[question...]", "Question for shorthand ask")
  .action(async (image: string | undefined, questionParts: string[] | undefined, options, command) => {
    if (!image) {
      command.help();
      return;
    }
    const question = questionParts?.join(" ").trim();
    if (!question) {
      throw new ImgxError("ARGUMENT_ERROR", "Missing question.", { hint: "Usage: imgx <image> <question>" });
    }
    const merged = command.optsWithGlobals();
    const { loaded } = loadForCommand(merged);
    const result = await analyzeImage(loaded, {
      imagePath: image,
      task: "general",
      question,
      json: Boolean(merged.json)
    });
    merged.json ? writeJson(result) : process.stdout.write(`${resultToText(result)}\n`);
  });

program.addCommand(initCommand());
program.addCommand(doctorCommand(VERSION));
program.addCommand(askCommand());
program.addCommand(describeCommand());
program.addCommand(ocrCommand());
program.addCommand(batchCommand());
program.addCommand(historyCommand());
program.addCommand(cacheCommand());
program.addCommand(setCommand());
program.addCommand(unsetCommand());

program
  .command("config")
  .description("Manage configuration")
  .action(() => {
    process.stdout.write("Config management beyond init is planned for a future release.\n");
  });

for (const name of ["locate", "crop", "annotate"]) {
  program
    .command(name)
    .description(`${name} image regions (planned for V0.2)`)
    .action(() => {
      process.stdout.write(`${name} is planned for V0.2.\n`);
    });
}

program
  .command("proxy")
  .description("Start OpenAI-compatible proxy server")
  .action(() => {
    process.stdout.write("Proxy mode is planned for V0.3.\n");
  });

program.exitOverride();

try {
  await program.parseAsync(process.argv);
} catch (error) {
  if (typeof error === "object" && error && "exitCode" in error && (error as { exitCode: number }).exitCode === 0) {
    process.exitCode = 0;
  } else {
  const imgxError = toImgxError(error);
  const globalJson = process.argv.includes("--json");
  if (globalJson) writeJson(errorJson(imgxError));
  else process.stderr.write(`${imgxError.code}: ${imgxError.message}${imgxError.hint ? `\nHint: ${imgxError.hint}` : ""}\n`);
  process.exitCode = exitCodeFor(imgxError.code);
  }
}
