import { ErrorCodes, type ErrorCode } from "./codes.js";

export const ExitCodes = {
  SUCCESS: 0,
  RUNTIME: 1,
  ARGUMENT: 2,
  CONFIG: 3,
  FILE: 4,
  PROVIDER: 5,
  DATABASE: 6,
  BATCH_PARTIAL: 7
} as const;

export function exitCodeFor(errorCode: ErrorCode): number {
  if (errorCode.startsWith("CONFIG_")) return ExitCodes.CONFIG;
  if (errorCode.startsWith("IMAGE_")) return ExitCodes.FILE;
  if (errorCode.startsWith("PROVIDER_")) return ExitCodes.PROVIDER;
  if (errorCode.startsWith("DB_") || errorCode.startsWith("CACHE_")) return ExitCodes.DATABASE;
  if (errorCode === ErrorCodes.BATCH_PARTIAL_FAILED) return ExitCodes.BATCH_PARTIAL;
  if (errorCode === ErrorCodes.BATCH_NO_MATCH) return ExitCodes.ARGUMENT;
  if (errorCode === ErrorCodes.ARGUMENT_ERROR) return ExitCodes.ARGUMENT;
  return ExitCodes.RUNTIME;
}

