import { readFile } from "node:fs/promises";
import { join } from "node:path";

const WEIGHTS = [400, 600, 700, 800] as const;
const files = await Promise.all(WEIGHTS.map((w) => readFile(join(process.cwd(), `assets/fonts/Geist-${w}.ttf`))));

/** Geist for ImageResponse (the bundled fallback has no bold). Traced via outputFileTracingIncludes. */
export const OG_FONTS = WEIGHTS.map((weight, i) => ({ name: "Geist", data: files[i], weight, style: "normal" as const }));
