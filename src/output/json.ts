import type { ImgxError } from "../errors/ImgxError.js";

export function writeJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

export function errorJson(error: ImgxError): Record<string, unknown> {
  return {
    ok: false,
    error: {
      code: error.code,
      message: error.message,
      ...(error.hint ? { hint: error.hint } : {})
    }
  };
}

