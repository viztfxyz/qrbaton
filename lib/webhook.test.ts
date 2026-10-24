import { createHash, createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/server", () => ({ after: (fn: () => Promise<void>) => fn() }));
const { callbackAllowed, notify } = await import("./webhook");
const { createSession, setStatus } = await import("./store");

afterEach(() => vi.unstubAllGlobals());

describe("callbackAllowed", () => {
  it("accepts public hosts and rejects internal ones", () => {
    expect(callbackAllowed("https://hooks.example.com/x")).toBe(true);
    for (const u of ["https://localhost/x", "https://127.0.0.1/x", "https://[::1]/x", "https://10.0.0.5/", "https://router/", "https://nas.local/", "https://db.internal/"]) {
      expect(callbackAllowed(u), u).toBe(false);
    }
  });
});

describe("status changes", () => {
  it("lets the creator overrule a payer's claim, but not a final status", async () => {
    const { session } = await createSession("pa=a%40b&am=1.00&cu=INR", null);
    const claimed = await setStatus(session.id, { status: "paid", paidBy: "payer", utr: "412345678901" });
    expect(claimed?.session).toMatchObject({ status: "paid", paidBy: "payer", utr: "412345678901" });
    // a second payer claim is ignored
    expect((await setStatus(session.id, { status: "failed", paidBy: "payer" }))?.changed).toBe(false);
    const overruled = await setStatus(session.id, { status: "failed", paidBy: "creator" });
    expect(overruled?.session.status).toBe("failed");
    expect(overruled?.session.paidBy).toBeUndefined();
    expect((await setStatus(session.id, { status: "paid", paidBy: "creator" }))?.changed).toBe(false);
  });
});

describe("notify", () => {
  it("POSTs the status signed with sha256(manageToken)", async () => {
    const fetch = vi.fn(async () => new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetch);
    const { session, manageToken } = await createSession("pa=a%40b&am=1.00&cu=INR", null, 600, "https://hooks.example.com/x");
    const r = await setStatus(session.id, { status: "paid", paidBy: "payer" });
    notify(r!.session);
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit & { headers: Record<string, string> }];
    expect(url).toBe("https://hooks.example.com/x");
    const key = createHash("sha256").update(manageToken).digest("hex");
    expect(init.headers["x-qrbaton-signature"]).toBe(`sha256=${createHmac("sha256", key).update(String(init.body)).digest("hex")}`);
    expect(JSON.parse(String(init.body))).toMatchObject({ event: "session.status", id: session.id, status: "paid", paidBy: "payer" });
  });
});
