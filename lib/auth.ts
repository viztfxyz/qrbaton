import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { type Session, countHits, hashToken, recordHit } from "./store";

const digest = (s: string) => createHash("sha256").update(s).digest();
const NO_STORE = { "cache-control": "no-store" };

/** Failed token attempts allowed per client IP per window before it gets 429s. */
const MAX_FAILURES = 10;
const FAIL_WINDOW_SEC = 15 * 60;

/** Anonymous session creation allowed per client IP per window. QRBATON_TOKEN holders are exempt. */
export const CREATE_LIMIT = Number(process.env.CREATE_LIMIT_PER_HOUR) || 60;
const CREATE_WINDOW_SEC = 60 * 60;

export const bearer = (req: Request) => /^Bearer\s+(.+)$/i.exec(req.headers.get("authorization") ?? "")?.[1].trim() ?? null;

const same = (a: string, b: string) => timingSafeEqual(digest(a), digest(b));

/** Holder of the optional QRBATON_TOKEN (first-party integrations). */
export function isTrusted(req: Request): boolean {
  const expected = process.env.QRBATON_TOKEN;
  const t = bearer(req);
  return !!expected && !!t && same(t, expected);
}

export const clientIp = (req: Request) =>
  req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";

const tooMany = (error: string, retryAfter: number) =>
  Response.json({ error }, { status: 429, headers: { ...NO_STORE, "retry-after": String(retryAfter) } });

/**
 * Creation is open to anyone; this caps it per IP so one caller can't flood storage.
 * Returns an error response, or null when the request may proceed.
 */
export async function limitCreate(req: Request): Promise<Response | null> {
  if (isTrusted(req)) return null;
  const n = await recordHit(`create:${clientIp(req)}`, CREATE_WINDOW_SEC);
  return n > CREATE_LIMIT ? tooMany(`rate limit: ${CREATE_LIMIT} links per hour per IP`, CREATE_WINDOW_SEC) : null;
}

/**
 * Bearer must be the session's manageToken (or QRBATON_TOKEN). Repeated bad tokens from one IP are
 * locked out for a while so tokens can't be brute-forced. Returns an error response, or null if allowed.
 */
export async function requireManage(req: Request, s: Session, token = bearer(req)): Promise<Response | null> {
  const k = `authfail:${clientIp(req)}`;
  if ((await countHits(k)) >= MAX_FAILURES) return tooMany("too many failed attempts; try later", FAIL_WINDOW_SEC);
  const master = process.env.QRBATON_TOKEN;
  if (token && ((master && same(token, master)) || (s.manageHash && same(hashToken(token), s.manageHash)))) return null;
  await recordHit(k, FAIL_WINDOW_SEC);
  return Response.json({ error: "unauthorized: send Authorization: Bearer <manageToken>" }, { status: 401, headers: NO_STORE });
}
