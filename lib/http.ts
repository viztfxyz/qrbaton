import "server-only";
import { InputError } from "./create";
import { StoreUnavailable } from "./store";

/** The API is meant to be called from anywhere, including browser-based agents. */
export const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, PATCH, OPTIONS",
  "access-control-allow-headers": "authorization, content-type, mcp-protocol-version, mcp-session-id",
  "access-control-max-age": "86400",
};

export const json = (body: unknown, status = 200, headers: HeadersInit = {}) =>
  Response.json(body, { status, headers: { "cache-control": "no-store", ...CORS, ...headers } });

export const preflight = () => new Response(null, { status: 204, headers: CORS });

/** Adds CORS to a response built elsewhere (e.g. an auth rejection). */
export function withCors(res: Response): Response {
  for (const [k, v] of Object.entries(CORS)) res.headers.set(k, v);
  return res;
}

/** Maps known errors to 400/503 JSON responses. */
export async function guarded(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof InputError) return json({ error: e.message, ...(e.issues ? { issues: e.issues } : {}) }, 400);
    if (e instanceof StoreUnavailable) return json({ error: e.message }, 503);
    throw e;
  }
}
