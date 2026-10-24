import { limitCreate } from "@/lib/auth";
import { createFromInput, InputError, publicOrigin } from "@/lib/create";
import { guarded, json, preflight, withCors } from "@/lib/http";
import type { CreateSessionInput } from "@/lib/order";

export const OPTIONS = preflight;

/** JSON body, or multipart with a `qr` file and `upi` / `payee` / `order` / `ttlSec` fields (objects as JSON strings). */
async function readBody(req: Request): Promise<CreateSessionInput> {
  if (!(req.headers.get("content-type") ?? "").includes("multipart/form-data")) {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") throw new InputError("body must be JSON (or multipart/form-data with a qr file)");
    return body;
  }
  const form = await req.formData().catch(() => {
    throw new InputError("unreadable multipart body");
  });
  const obj = (k: string) => {
    const v = form.get(k);
    if (typeof v !== "string" || !v) return undefined;
    try {
      return JSON.parse(v);
    } catch {
      throw new InputError(`${k}: must be a JSON string`);
    }
  };
  const file = form.get("qr");
  const upi = form.get("upi");
  const ttl = form.get("ttlSec");
  return {
    upi: typeof upi === "string" && upi ? upi : undefined,
    qr: file instanceof Blob ? Buffer.from(await file.arrayBuffer()).toString("base64") : typeof file === "string" && file ? file : undefined,
    payee: obj("payee"),
    order: obj("order"),
    ttlSec: typeof ttl === "string" && ttl ? Number(ttl) : undefined,
  };
}

/** Create a pay session. Open to anyone (rate-limited per IP); see /llms.txt and /openapi.json. */
export async function POST(req: Request) {
  return guarded(async () => {
    const limited = await limitCreate(req);
    if (limited) return withCors(limited);
    return json(await createFromInput(await readBody(req), publicOrigin(req)), 201);
  });
}
