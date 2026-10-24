import { clientIp } from "@/lib/auth";
import { guarded, json, preflight } from "@/lib/http";
import { ClaimSchema } from "@/lib/order";
import { getSession, recordHit, setStatus } from "@/lib/store";
import { notify, view } from "@/lib/webhook";

export const OPTIONS = preflight;

/**
 * The payer tapping "I've paid" on the page. Anyone holding the link may call it (the link is the
 * secret); the session becomes paid with paidBy: "payer", and the creator is notified to confirm.
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const parsed = ClaimSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return json({ error: parsed.error.issues[0]?.message ?? "invalid body" }, 400);
  return guarded(async () => {
    if ((await recordHit(`claim:${clientIp(req)}`, 600)) > 30) return json({ error: "too many requests" }, 429);
    const s = await getSession(id);
    if (!s) return json({ error: "not found or expired" }, 404);
    if (s.status !== "pending") return json(view(s), 409);
    const r = await setStatus(id, { status: "paid", paidBy: "payer", utr: parsed.data.utr });
    if (!r) return json({ error: "not found or expired" }, 404);
    if (r.changed) notify(r.session);
    return json(view(r.session));
  });
}
