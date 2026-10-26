import { z } from "zod";

const money = z.number().finite().gte(-10_000_000).lte(10_000_000);
const httpsUrl = z
  .string()
  .max(1000)
  .refine((s) => {
    try {
      return new URL(s).protocol === "https:";
    } catch {
      return false;
    }
  }, "must be an https URL");

/** Order summary an agent or merchant integration attaches to a pay session. */
export const OrderSchema = z.object({
  merchant: z.string().trim().min(1).max(60),
  /** Optional merchant logo; known brands (Blinkit, Swiggy, Zomato…) get one automatically. */
  logo: httpsUrl.optional(),
  total: money,
  items: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(200),
        unit: z.string().trim().max(60).optional(),
        qty: z.number().int().min(1).max(999),
        price: money,
        mrp: money.optional(),
        image: httpsUrl.optional(),
      }),
    )
    .max(200),
  charges: z.array(z.object({ label: z.string().trim().min(1).max(60), amount: money })).max(30),
  delivery: z
    .object({
      slot: z.string().trim().max(100).optional(),
      address: z
        .object({ label: z.string().trim().max(60).optional(), text: z.string().trim().max(500).optional() })
        .optional(),
    })
    .optional(),
  orderId: z.string().trim().max(40).optional(),
  /** Shop or cart page the order comes from; its domain is shown on the page. */
  site: httpsUrl.optional(),
  /** Who prepared the link, e.g. "Claude for Priya". */
  agent: z.string().trim().max(60).optional(),
  /** Short message to the payer. */
  note: z.string().trim().max(300).optional(),
});

export type Order = z.infer<typeof OrderSchema>;

/** What callers send: total, items and charges may be omitted and are derived when possible. */
export const OrderInputSchema = OrderSchema.extend({
  total: money.optional(),
  items: OrderSchema.shape.items.default([]),
  charges: OrderSchema.shape.charges.default([]),
});

export const STATUSES = ["pending", "paid", "failed", "expired"] as const;
export type Status = (typeof STATUSES)[number];

/** Plain UPI fields; merged over `upi`/`qr` when both are given (e.g. a static QR plus an amount). */
export const PayeeSchema = z.object({
  pa: z.string().trim().max(100).optional(),
  pn: z.string().trim().max(100).optional(),
  am: z.union([z.number().positive().lte(10_000_000), z.string().trim().regex(/^\d+(\.\d{1,2})?$/)]).optional(),
  tn: z.string().trim().max(100).optional(),
  tr: z.string().trim().max(50).optional(),
});

/** Longest a pay link accepts payment for. */
export const MAX_TTL_SEC = 24 * 3600;

/** Image as base64 or a data: URI. ~4 MB of image after decoding (Vercel caps bodies at 4.5 MB). */
export const MAX_QR_B64 = 5_600_000;

export const CreateSessionSchema = z
  .object({
    upi: z.string().max(2000).optional(),
    qr: z.string().max(MAX_QR_B64).optional(),
    payee: PayeeSchema.optional(),
    order: OrderInputSchema.optional(),
    ttlSec: z
      .number()
      .int()
      .min(60)
      .max(MAX_TTL_SEC)
      .optional()
      .describe("Optional. Seconds until payment closes: 60 to 86400 (24 hours). Defaults to 1800 (30 minutes). Or use expiresInMinutes."),
    expiresInMinutes: z
      .number()
      .int()
      .min(1)
      .max(MAX_TTL_SEC / 60)
      .optional()
      .describe("Optional. Minutes until payment closes: 1 to 1440 (24 hours). Defaults to 30. Same as ttlSec, in minutes; send one or the other."),
    /** https URL that gets a signed POST whenever the status changes. */
    callbackUrl: httpsUrl.optional(),
  })
  .refine((b) => b.upi || b.qr || b.payee?.pa, { message: "send one of: upi, qr, or payee.pa" })
  .refine((b) => !(b.upi && b.qr), { message: "send upi or qr, not both" })
  .refine((b) => b.ttlSec === undefined || b.expiresInMinutes === undefined, { message: "send ttlSec or expiresInMinutes, not both" });

export type CreateSessionInput = z.input<typeof CreateSessionSchema>;

/** UPI transaction reference (UTR / RRN), as shown in the payer's UPI app. */
export const utrSchema = z.string().trim().regex(/^[A-Za-z0-9]{6,35}$/, "UTR is 6-35 letters/digits");

export const UpdateSessionSchema = z.object({ status: z.enum(["paid", "failed", "expired"]), utr: utrSchema.optional() });

/** The payer saying "I've paid" from the page; unverified, so it's recorded as paidBy: "payer". */
export const ClaimSchema = z.object({ utr: utrSchema.optional() });
