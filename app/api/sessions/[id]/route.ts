import { requireManage } from "@/lib/auth";
import { guarded, json, preflight, withCors } from "@/lib/http";
import { UpdateSessionSchema } from "@/lib/order";
import { getSession, setStatus } from "@/lib/store";
import { notify, view } from "@/lib/webhook";

export const OPTIONS = preflight;

/** Public view: status only. Order details are rendered into the page, never served as JSON. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return guarded(async () => {
    const s = await getSession(id);
    return s ? json(view(s)) : json({ status: "expired" }, 404);
  });
}

/** Report the payment outcome. Auth: `Authorization: Bearer <manageToken>` (or QRBATON_TOKEN). */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const parsed = UpdateSessionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "status must be paid | failed | expired", issues: parsed.error.issues }, 400);
  return guarded(async () => {
    const s = await getSession(id);
    if (!s) return json({ error: "not found or expired" }, 404);
    const denied = await requireManage(req, s);
    if (denied) return withCors(denied);
    const r = await setStatus(id, { ...parsed.data, paidBy: "creator" });
    if (!r) return json({ error: "not found or expired" }, 404);
    if (r.changed) notify(r.session);
    return json(view(r.session));
  });
}
