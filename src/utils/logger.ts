import { redactText } from "./redact.js";

export type LogLevel = "quiet" | "normal" | "verbose" | "debug";

export class Logger {
  constructor(private readonly level: LogLevel = "normal") {}

  info(message: string): void {
    if (this.level === "quiet") return;
    process.stderr.write(`${redactText(message)}\n`);
  }

  verbose(message: string): void {
    if (this.level !== "verbose" && this.level !== "debug") return;
    process.stderr.write(`${redactText(message)}\n`);
  }

  debug(message: string): void {
    if (this.level !== "debug") return;
    process.stderr.write(`${redactText(message)}\n`);
  }
}

