import QRCode from "qrcode";
import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { createFromInput, InputError } = await import("./create");
const { getSession } = await import("./store");

const ORIGIN = "https://pay.example";
const qrB64 = async (text: string) => (await QRCode.toBuffer(text, { margin: 4, width: 400 })).toString("base64");

describe("createFromInput", () => {
  it("decodes a QR and takes the amount from the items", async () => {
    const c = await createFromInput(
      {
        qr: await qrB64("upi://pay?pa=shop@ybl&pn=Shop"),
        order: { merchant: "Shop", site: "https://shop.example/cart", items: [{ name: "Milk", qty: 2, price: 56 }, { name: "Bread", qty: 1, price: 10 }] },
      },
      ORIGIN,
    );
    expect(c.url).toBe(`${ORIGIN}/p/${c.id}`);
    expect(c.payee).toEqual({ pa: "shop@ybl", pn: "Shop", am: "122.00" });
    expect(c.manageToken.length).toBeGreaterThan(20);
    const s = await getSession(c.id);
    expect(s?.order?.total).toBe(122);
    expect(s?.manageHash).not.toContain(c.manageToken);
  });

  it("reads a QR inside a larger JPEG photo", async () => {
    const qr = await QRCode.toBuffer("upi://pay?pa=a@okaxis&am=5", { width: 300 });
    const photo = await sharp({ create: { width: 2400, height: 1800, channels: 3, background: "#d8d2c4" } })
      .composite([{ input: qr, left: 900, top: 700 }])
      .jpeg()
      .toBuffer();
    const c = await createFromInput({ qr: `data:image/jpeg;base64,${photo.toString("base64")}` }, ORIGIN);
    expect(c.payee.am).toBe("5.00");
  });

  it("lets payee fields override the QR", async () => {
    const c = await createFromInput({ qr: await qrB64("upi://pay?pa=shop@ybl&pn=Shop"), payee: { am: 99 } }, ORIGIN);
    expect(c.payee.am).toBe("99.00");
  });

  it("accepts plain payee fields", async () => {
    const c = await createFromInput({ payee: { pa: "x@upi", pn: "X", am: "10.5" } }, ORIGIN);
    expect(c.payee).toEqual({ pa: "x@upi", pn: "X", am: "10.50" });
  });

  it("rejects mismatched totals, non-UPI QRs and missing payees", async () => {
    await expect(createFromInput({ upi: "upi://pay?pa=a@b&am=10", order: { merchant: "M", total: 11 } }, ORIGIN)).rejects.toThrow(/must equal/);
    await expect(
      createFromInput({ payee: { pa: "a@b" }, order: { merchant: "M", items: [{ name: "x", qty: 1, price: 5 }], charges: [{ label: "Delivery", amount: 1 }] } }, ORIGIN),
    ).rejects.toThrow(/total is required/);
    await expect(createFromInput({ qr: await qrB64("https://evil.example") }, ORIGIN)).rejects.toThrow(/not a UPI payment QR/);
    await expect(createFromInput({ qr: Buffer.from("not an image").toString("base64") }, ORIGIN)).rejects.toThrow(InputError);
    await expect(createFromInput({ payee: { pn: "No VPA" } }, ORIGIN)).rejects.toThrow(InputError);
    await expect(createFromInput({ payee: { pa: "bad" } }, ORIGIN)).rejects.toThrow(/valid UPI ID/);
  });
});
