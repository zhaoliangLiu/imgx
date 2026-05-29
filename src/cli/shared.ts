import { loadConfig, type LoadedConfig } from "../config/loadConfig.js";
import { Logger, type LogLevel } from "../utils/logger.js";

export type GlobalOptions = {
  config?: string;
  json?: boolean;
  quiet?: boolean;
  verbose?: boolean;
  debug?: boolean;
};

export function logLevel(options: GlobalOptions): LogLevel {
  if (options.quiet) return "quiet";
  if (options.debug) return "debug";
  if (options.verbose) return "verbose";
  return "normal";
}

export function loadForCommand(options: GlobalOptions & Record<string, unknown>): { loaded: LoadedConfig; logger: Logger } {
  return {
    loaded: loadConfig({
      config: options.config,
      baseURL: typeof options.baseUrl === "string" ? options.baseUrl : undefined,
      model: typeof options.model === "string" ? options.model : undefined,
      apiKeyEnv: typeof options.apiKeyEnv === "string" ? options.apiKeyEnv : undefined,
      timeoutMs: options.timeout ? Number(options.timeout) : undefined
    }),
    logger: new Logger(logLevel(options))
  };
}

