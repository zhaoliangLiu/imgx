import { hashImage } from "./hashImage.js";
import type { NormalizedImage } from "./normalizeImage.js";

export function imageRecord(absPath: string, sizeBytes: number, normalized: NormalizedImage): {
  sha256: string;
  path: string;
  mime: string;
  width?: number;
  height?: number;
  sizeBytes: number;
} {
  return {
    sha256: hashImage(normalized.buffer),
    path: absPath,
    mime: normalized.mime,
    width: normalized.width,
    height: normalized.height,
    sizeBytes
  };
}

