import "server-only";
import jsQR from "jsqr";
import sharp from "sharp";

/** Longest side jsQR sees; phone photos are downscaled for speed, tiny crops upscaled so modules resolve. */
const SIZES = [1200, 2000, 600];

/** Decodes the first QR code in an image (PNG, JPEG, WebP, GIF, AVIF…). Returns its text, or null. */
export async function decodeQr(img: Buffer): Promise<string | null> {
  for (const size of SIZES) {
    const { data, info } = await sharp(img, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize(size, size, { fit: "inside" })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const code = jsQR(new Uint8ClampedArray(data.buffer, data.byteOffset, data.length), info.width, info.height, {
      inversionAttempts: "attemptBoth",
    });
    if (code?.data) return code.data;
  }
  return null;
}

/** Accepts plain base64 (standard or url-safe) or a `data:image/...;base64,` URI. */
export function fromBase64(s: string): Buffer {
  return Buffer.from(s.replace(/^data:[^,]*,/, "").replace(/\s+/g, ""), "base64");
}
