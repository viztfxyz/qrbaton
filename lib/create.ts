import "server-only";
import { type CreateSessionInput, CreateSessionSchema, type Order } from "./order";
import { decodeQr, fromBase64 } from "./qr";
import { createSession } from "./store";
import { parseUpi } from "./upi";
import { callbackAllowed } from "./webhook";

export class InputError extends Error {
  constructor(
    message: string,
    readonly issues?: unknown,
  ) {
    super(message);
  }
}

export interface Created {
  id: string;
  url: string;
  statusUrl: string;
  manageToken: string;
  expiresAt: number;
  payee: { pa: string; pn: string; am: string };
}

const paise = (n: number) => Math.round(n * 100);
const fmtAm = (n: number) => (paise(n) / 100).toFixed(2);

/**
 * Resolves any accepted input (QR image, upi:// string, plain payee fields, or a mix) into a stored
 * session. The UPI amount and order total must agree; whichever is missing is derived from the other,
 * or from the items when both are missing and there are no charges (charges are the full bill as shown,
 * often including an "Item total" line, so summing them with items would be a guess). Throws InputError.
 */
export async function createFromInput(input: CreateSessionInput, origin: string): Promise<Created> {
  const parsed = CreateSessionSchema.safeParse(input);
  if (!parsed.success) throw new InputError("invalid body", parsed.error.issues);
  const { upi: raw, qr, payee, order: orderIn, ttlSec, expiresInMinutes, callbackUrl } = parsed.data;

  if (callbackUrl && !callbackAllowed(callbackUrl)) throw new InputError("callbackUrl must be a public https host");

  let base = raw ?? "";
  if (qr) {
    const img = fromBase64(qr);
    if (!img.length) throw new InputError("qr: not valid base64");
    const text = await decodeQr(img).catch(() => {
      throw new InputError("qr: unreadable image");
    });
    if (!text) throw new InputError("qr: no QR code found in the image");
    if (!/^upi:\/\/pay\?/i.test(text.trim())) throw new InputError("qr: not a UPI payment QR", { decoded: text.slice(0, 200) });
    base = text;
  }

  const p = new URLSearchParams(parseUpi(base)?.qs ?? "");
  if (base && !p.get("pa")) throw new InputError("upi must be a upi://pay?… string with a valid pa");
  for (const [k, v] of Object.entries(payee ?? {})) if (v !== undefined && v !== "") p.set(k, String(v));

  let am = p.get("am") ? Number(p.get("am")) : null;
  if (am !== null && !Number.isFinite(am)) throw new InputError(`amount is not a number: ${p.get("am")}`);
  let order: Order | null = null;
  if (orderIn) {
    const items = orderIn.items.reduce((n, i) => n + i.price * i.qty, 0);
    const total = orderIn.total ?? am ?? (orderIn.items.length && !orderIn.charges.length ? items : null);
    if (total === null) {
      throw new InputError(orderIn.charges.length ? "order.total is required when order.charges are given" : "no amount: send payee.am, order.total, or order.items");
    }
    if (am !== null && paise(am) !== paise(total)) {
      throw new InputError(`order.total (${total}) must equal the UPI amount (${p.get("am")})`);
    }
    order = { ...orderIn, total };
    am ??= total;
  }
  if (am !== null) {
    if (!(am > 0)) throw new InputError("amount must be positive");
    p.set("am", fmtAm(am));
  }

  const upi = parseUpi(p);
  if (!upi) throw new InputError("payee.pa must be a valid UPI ID like name@bank");
  const { session, manageToken } = await createSession(upi.qs, order, ttlSec ?? (expiresInMinutes && expiresInMinutes * 60), callbackUrl);
  return {
    id: session.id,
    url: `${origin}/p/${session.id}`,
    statusUrl: `${origin}/api/sessions/${session.id}`,
    manageToken,
    expiresAt: session.expiresAt,
    payee: { pa: upi.pa, pn: upi.pn, am: upi.am },
  };
}

export const publicOrigin = (req: Request) => process.env.PUBLIC_URL?.replace(/\/$/, "") ?? new URL(req.url).origin;
