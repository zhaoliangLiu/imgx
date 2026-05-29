import sharp from "sharp";
import { ImgxError } from "../errors/ImgxError.js";

export type NormalizedImage = {
  buffer: Buffer;
  mime: string;
  width?: number;
  height?: number;
};

export async function normalizeImage(
  input: Buffer,
  options: { autoResize: boolean; maxWidth: number; maxHeight: number; stripExif: boolean }
): Promise<NormalizedImage> {
  try {
    const source = sharp(input, { failOn: "error" });
    const metadata = await source.metadata();
    let pipeline = source.rotate();
    if (options.autoResize) {
      pipeline = pipeline.resize({
        width: options.maxWidth,
        height: options.maxHeight,
        fit: "inside",
        withoutEnlargement: true
      });
    }
    if (!options.stripExif) pipeline = pipeline.keepMetadata();
    const format = metadata.format === "jpg" ? "jpeg" : metadata.format;
    const safeFormat = format === "png" || format === "jpeg" || format === "webp" ? format : "png";
    const output = await pipeline.toFormat(safeFormat).toBuffer({ resolveWithObject: true });
    return {
      buffer: output.data,
      mime: `image/${safeFormat}`,
      width: output.info.width,
      height: output.info.height
    };
  } catch (error) {
    throw new ImgxError("IMAGE_DECODE_FAILED", "Cannot decode image.", { cause: error });
  }
}

