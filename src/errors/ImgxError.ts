import type { ErrorCode } from "./codes.js";

export class ImgxError extends Error {
  readonly code: ErrorCode;
  readonly hint?: string;
  readonly cause?: unknown;

  constructor(code: ErrorCode, message: string, options: { hint?: string; cause?: unknown } = {}) {
    super(message);
    this.name = "ImgxError";
    this.code = code;
    this.hint = options.hint;
    this.cause = options.cause;
  }
}

export function toImgxError(error: unknown): ImgxError {
  if (error instanceof ImgxError) return error;
  if (error instanceof Error) {
    return new ImgxError("RUNTIME_ERROR", error.message, { cause: error });
  }
  return new ImgxError("RUNTIME_ERROR", String(error));
}

