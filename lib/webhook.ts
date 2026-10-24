import "server-only";
import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { after } from "next/server";
import type { Session } from "./store";

/** Public status shape, shared by GET /api/sessions/{id}, MCP and webhooks. */
export const view = (s: Session) => ({
  id: s.id,
  status: s.status,
  ...(s.paidBy ? { paidBy: s.paidBy } : {}),
  ...(s.utr ? { utr: s.utr } : {}),
  updatedAt: s.updatedAt,
  expiresAt: s.expiresAt,
});

/** Rejects callback hosts that point at the server's own network (localhost, IP literals, internal names). */
export function callbackAllowed(url: string): boolean {
  const host = new URL(url).hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (isIP(host) || !host.includes(".")) return false;
  return !/(^|\.)(localhost|local|internal|intranet|lan|home\.arpa)$/.test(host);
}

/**
 * POSTs the new status to the session's callbackUrl after the response is sent. Signed with
 * HMAC-SHA256 keyed by sha256(manageToken) as hex, so receivers verify with the token they already hold:
 * `x-qrbaton-signature: sha256=<hex hmac of the raw body>`.
 */
export function notify(s: Session) {
  if (!s.callbackUrl || !s.manageHash) return;
  const { callbackUrl, manageHash } = s;
  after(async () => {
    const body = JSON.stringify({ event: "session.status", ...view(s) });
    const sig = createHmac("sha256", manageHash).update(body).digest("hex");
    for (const wait of [0, 1500]) {
      await new Promise((r) => setTimeout(r, wait));
      try {
        const r = await fetch(callbackUrl, {
          method: "POST",
          headers: { "content-type": "application/json", "user-agent": "qrbaton-webhook/1", "x-qrbaton-signature": `sha256=${sig}` },
          body,
          redirect: "manual",
          signal: AbortSignal.timeout(5000),
        });
        if (r.ok) return;
      } catch {}
    }
  });
}
