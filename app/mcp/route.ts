import { createdProps, distinctFor, track } from "@/lib/analytics";
import { limitCreate, requireManage } from "@/lib/auth";
import { SITE } from "@/lib/site";
import { createInputSchema } from "@/lib/apiSpec";
import { createFromInput, InputError, publicOrigin } from "@/lib/create";
import { CORS, json, preflight } from "@/lib/http";
import { UpdateSessionSchema } from "@/lib/order";
import { StoreUnavailable, getSession, setStatus } from "@/lib/store";
import { notify, view } from "@/lib/webhook";

/**
 * Minimal stateless MCP server (streamable HTTP transport, JSON responses only). Every tool call is
 * a plain request, so no session state is kept between calls.
 */

const VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];

type Rpc = { jsonrpc: "2.0"; id?: string | number | null; method: string; params?: Record<string, unknown> };

const TOOLS = () => [
  {
    name: "create_pay_link",
    title: "Create UPI pay link",
    description:
      "Create a review-and-pay page for a UPI payment and get its URL to send to the person who pays. Give the payee as qr (base64 image of a UPI QR), upi (upi://pay?... string), or payee {pa, pn, am}; payee fields override the QR. Add order (merchant, site, agent, note, items, charges, delivery) to show the cart. Returns url (send this), id, and manageToken (keep it; needed for set_payment_status).",
    inputSchema: createInputSchema(),
  },
  {
    name: "get_payment_status",
    title: "Get payment status",
    description: 'Status of a pay link: pending, paid, failed or expired. paidBy "payer" means the payer tapped "I\'ve paid" (unverified, may include their UTR); confirm or overrule it with set_payment_status.',
    inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
    annotations: { readOnlyHint: true },
  },
  {
    name: "set_payment_status",
    title: "Report payment outcome",
    description: "Mark a pay link paid, failed or expired once you know the outcome; the open page updates live. Needs the manageToken from create_pay_link.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        manageToken: { type: "string" },
        status: { enum: ["paid", "failed", "expired"] },
        utr: { type: "string", description: "Optional UPI transaction reference" },
      },
      required: ["id", "manageToken", "status"],
    },
  },
];

const text = (data: unknown, isError = false) => ({
  content: [{ type: "text", text: typeof data === "string" ? data : JSON.stringify(data, null, 2) }],
  ...(typeof data === "object" && !isError ? { structuredContent: data } : {}),
  isError,
});

const errorBody = async (res: Response) => ((await res.json()) as { error: string }).error;

async function callTool(req: Request, name: string, args: Record<string, unknown>) {
  try {
    switch (name) {
      case "create_pay_link": {
        const limited = await limitCreate(req);
        if (limited) {
          track("pay_link_rate_limited", distinctFor(req), { source: "mcp" });
          return text(await errorBody(limited), true);
        }
        const c = await createFromInput(args, publicOrigin(req)).catch((e) => {
          if (e instanceof InputError) track("pay_link_create_failed", distinctFor(req), { source: "mcp", error: e.message });
          throw e;
        });
        track("pay_link_created", distinctFor(req), { source: "mcp", ...createdProps(args) });
        return text({ ...c, tell_payer: `Review and pay here: ${c.url}` });
      }
      case "get_payment_status": {
        const s = await getSession(String(args.id ?? ""));
        return text(s ? view(s) : { status: "expired" });
      }
      case "set_payment_status": {
        const parsed = UpdateSessionSchema.safeParse(args);
        if (!parsed.success) return text("status must be paid | failed | expired", true);
        const s = await getSession(String(args.id ?? ""));
        if (!s) return text("not found or expired", true);
        const denied = await requireManage(req, s, String(args.manageToken ?? ""));
        if (denied) return text(await errorBody(denied), true);
        const r = await setStatus(s.id, { ...parsed.data, paidBy: "creator" });
        if (!r) return text("not found or expired", true);
        if (r.changed) notify(r.session);
        return text(view(r.session));
      }
    }
    return null;
  } catch (e) {
    if (e instanceof InputError) return text(e.issues ? { error: e.message, issues: e.issues } : e.message, true);
    if (e instanceof StoreUnavailable) return text(e.message, true);
    throw e;
  }
}

async function handle(req: Request, m: Rpc) {
  const ok = (result: unknown) => ({ jsonrpc: "2.0", id: m.id, result });
  const fail = (code: number, message: string) => ({ jsonrpc: "2.0", id: m.id ?? null, error: { code, message } });
  switch (m.method) {
    case "initialize": {
      const asked = String(m.params?.protocolVersion ?? "");
      return ok({
        protocolVersion: VERSIONS.includes(asked) ? asked : VERSIONS[0],
        capabilities: { tools: {} },
        serverInfo: { name: SITE.name, version: "1.0.0" },
        instructions: "Use create_pay_link to turn a UPI QR or UPI details plus an optional cart into a pay page URL, then send the URL to whoever pays.",
      });
    }
    case "ping":
      return ok({});
    case "tools/list":
      return ok({ tools: TOOLS() });
    case "tools/call": {
      const name = String(m.params?.name ?? "");
      const r = await callTool(req, name, (m.params?.arguments as Record<string, unknown>) ?? {});
      return r ? ok(r) : fail(-32602, `unknown tool: ${name}`);
    }
    default:
      return fail(-32601, `method not found: ${m.method}`);
  }
}

export const OPTIONS = preflight;

export async function POST(req: Request) {
  const body = await req.json().catch(() => undefined);
  if (body === undefined) return json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "parse error" } }, 400);
  const batch = Array.isArray(body);
  const msgs = (batch ? body : [body]) as Rpc[];
  const out = [];
  for (const m of msgs) {
    if (!m || typeof m.method !== "string") {
      out.push({ jsonrpc: "2.0", id: m?.id ?? null, error: { code: -32600, message: "invalid request" } });
    } else if (m.id !== undefined && m.id !== null) {
      out.push(await handle(req, m));
    }
    // notifications (no id) get no response
  }
  if (!out.length) return new Response(null, { status: 202, headers: CORS });
  return json(batch ? out : out[0]);
}

/** No server-initiated stream. */
export const GET = () => new Response("Method Not Allowed", { status: 405, headers: { allow: "POST, OPTIONS", ...CORS } });
