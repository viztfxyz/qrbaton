import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { Redis } from "@upstash/redis";
import type { Order, Status } from "./order";

export interface Session {
  id: string;
  /** Canonical UPI query string (see parseUpi). */
  upi: string;
  order: Order | null;
  status: Status;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  /** sha256 of the manageToken handed to the creator; lets them report the outcome. */
  manageHash?: string;
  callbackUrl?: string;
  /** Who reported a paid status: the creator (API/agent) or the payer tapping "I've paid". */
  paidBy?: "creator" | "payer";
  utr?: string;
}

export type Outcome = { status: Exclude<Status, "pending">; paidBy?: Session["paidBy"]; utr?: string };

export const DEFAULT_TTL_SEC = 30 * 60;
/** How long a page stays readable after payment closes, so the payer can still see what the order was. */
export const RETAIN_SEC = 24 * 3600;
const key = (id: string) => `qrbaton:session:${id}`;
const ALPHABET = "23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";

const ID_LEN = 14;
/** Largest multiple of the alphabet size that fits in a byte; bytes above it are rejected to avoid modulo bias. */
const BYTE_LIMIT = 256 - (256 % ALPHABET.length);

/** 14 chars from a 56-symbol alphabet ≈ 81 bits; links carry an address, so they must not be guessable. */
export function newId(): string {
  let out = "";
  while (out.length < ID_LEN) {
    for (const b of randomBytes(ID_LEN * 2)) {
      if (b < BYTE_LIMIT) out += ALPHABET[b % ALPHABET.length];
      if (out.length === ID_LEN) break;
    }
  }
  return out;
}

export const validId = (id: string) => id.length === ID_LEN && [...id].every((c) => ALPHABET.includes(c));

interface Backend {
  get(id: string): Promise<Session | null>;
  put(s: Session, ttlSec: number): Promise<void>;
  /** Overwrite, keeping the existing expiry. */
  replace(s: Session): Promise<void>;
  /** Current value of a fixed-window counter. */
  count(key: string): Promise<number>;
  /** Increment a counter that resets `windowSec` after its first hit. */
  bump(key: string, windowSec: number): Promise<number>;
}

function redisBackend(): Backend | null {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const r = new Redis({ url, token });
  return {
    get: (id) => r.get<Session>(key(id)),
    put: async (s, ttl) => void (await r.set(key(s.id), s, { ex: ttl })),
    replace: async (s) => void (await r.set(key(s.id), s, { keepTtl: true, xx: true })),
    count: async (k) => Number((await r.get<number>(`qrbaton:${k}`)) ?? 0),
    bump: async (k, ttl) => {
      const n = await r.incr(`qrbaton:${k}`);
      if (n === 1) await r.expire(`qrbaton:${k}`, ttl);
      return n;
    },
  };
}

/** In-process store for `next dev` without Redis credentials. */
function memoryBackend(): Backend {
  const g = globalThis as { __qrbatonSessions?: Map<string, Session>; __qrbatonCounters?: Map<string, { n: number; until: number }> };
  const m = (g.__qrbatonSessions ??= new Map());
  const c = (g.__qrbatonCounters ??= new Map());
  const counter = (k: string) => {
    const v = c.get(k);
    return v && v.until > Date.now() ? v : null;
  };
  const live = (s: Session | undefined) => (s && s.expiresAt + RETAIN_SEC * 1000 > Date.now() ? s : null);
  return {
    get: async (id) => live(m.get(id)),
    put: async (s) => void m.set(s.id, s),
    replace: async (s) => void (live(m.get(s.id)) && m.set(s.id, s)),
    count: async (k) => counter(k)?.n ?? 0,
    bump: async (k, ttl) => {
      const v = counter(k) ?? { n: 0, until: Date.now() + ttl * 1000 };
      v.n++;
      c.set(k, v);
      return v.n;
    },
  };
}

export class StoreUnavailable extends Error {}

function backend(): Backend {
  const r = redisBackend();
  if (r) return r;
  if (process.env.NODE_ENV === "production") {
    throw new StoreUnavailable("session storage not configured (connect Upstash Redis to this project)");
  }
  return memoryBackend();
}

export const countHits = (k: string) => backend().count(k);
export const recordHit = (k: string, windowSec: number) => backend().bump(k, windowSec);

export const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

/** Creates a session plus the one-time manageToken (returned only here; only its hash is stored). */
export async function createSession(
  upi: string,
  order: Order | null,
  ttlSec = DEFAULT_TTL_SEC,
  callbackUrl?: string,
): Promise<{ session: Session; manageToken: string }> {
  const now = Date.now();
  const manageToken = randomBytes(24).toString("base64url");
  const s: Session = {
    id: newId(),
    upi,
    order,
    status: "pending",
    createdAt: now,
    updatedAt: now,
    expiresAt: now + ttlSec * 1000,
    manageHash: hashToken(manageToken),
    ...(callbackUrl ? { callbackUrl } : {}),
  };
  await backend().put(s, ttlSec + RETAIN_SEC);
  return { session: s, manageToken };
}

export async function getSession(id: string): Promise<Session | null> {
  if (!validId(id)) return null;
  const s = await backend().get(id);
  if (s && s.status === "pending" && s.expiresAt <= Date.now()) return { ...s, status: "expired" };
  return s;
}

/**
 * Move a pending session to a terminal status. Terminal statuses are final, except that the creator
 * may overrule a payer's unverified "I've paid" (e.g. mark it failed after checking their account).
 * `changed` is false when nothing was written.
 */
export async function setStatus(id: string, o: Outcome): Promise<{ session: Session; changed: boolean } | null> {
  const s = await getSession(id);
  if (!s) return null;
  const overrule = s.paidBy === "payer" && o.paidBy === "creator";
  if (s.status !== "pending" && !overrule) return { session: s, changed: false };
  const next: Session = { ...s, status: o.status, updatedAt: Date.now() };
  if (o.status === "paid") next.paidBy = o.paidBy ?? "creator";
  else delete next.paidBy;
  if (o.utr) next.utr = o.utr;
  await backend().replace(next);
  return { session: next, changed: true };
}
