import fs from "node:fs";
import path from "node:path";
import { ImgxError } from "../errors/ImgxError.js";

export function loadImageFile(imagePath: string, options: { allowedExtensions: string[]; maxSizeMB: number }): { absPath: string; buffer: Buffer; sizeBytes: number } {
  const absPath = path.resolve(imagePath);
  const ext = path.extname(absPath).toLowerCase();
  if (!options.allowedExtensions.includes(ext)) {
    throw new ImgxError("IMAGE_UNSUPPORTED_FORMAT", `Unsupported image format: ${ext || "(none)"}`, {
      hint: `Allowed extensions: ${options.allowedExtensions.join(", ")}`
    });
  }
  if (!fs.existsSync(absPath)) {
    throw new ImgxError("IMAGE_FILE_NOT_FOUND", `Image file not found: ${imagePath}`, {
      hint: "Use an absolute path or check whether the file exists."
    });
  }
  let stat: fs.Stats;
  try {
    stat = fs.statSync(absPath);
  } catch (error) {
    throw new ImgxError("IMAGE_PERMISSION_DENIED", `Cannot access image file: ${imagePath}`, { cause: error });
  }
  const maxBytes = options.maxSizeMB * 1024 * 1024;
  if (stat.size > maxBytes) {
    throw new ImgxError("IMAGE_TOO_LARGE", `Image is larger than ${options.maxSizeMB} MB: ${imagePath}`);
  }
  try {
    return { absPath, buffer: fs.readFileSync(absPath), sizeBytes: stat.size };
  } catch (error) {
    throw new ImgxError("IMAGE_PERMISSION_DENIED", `Cannot read image file: ${imagePath}`, { cause: error });
  }
}

