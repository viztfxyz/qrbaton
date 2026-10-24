/** UPI intent parsing and per-app deep links. Every param passes through unchanged. */

export type AppKey = "g" | "p" | "t" | "u";

export interface UpiApp {
  k: AppKey;
  name: string;
  icon: string;
  scheme: string;
}

export const APPS: UpiApp[] = [
  { k: "p", name: "PhonePe", icon: "Pe", scheme: "phonepe://pay?" },
  { k: "g", name: "GPay", icon: "G", scheme: "gpay://upi/pay?" },
  { k: "t", name: "Paytm", icon: "Pt", scheme: "paytmmp://pay?" },
  { k: "u", name: "Other UPI app", icon: "₹", scheme: "upi://pay?" },
];

export interface Upi {
  /** Canonical query string (empty values dropped, cu defaulted to INR). */
  qs: string;
  pa: string;
  pn: string;
  am: string;
  cu: string;
  tr: string;
  tn: string;
}

/** Parse a query string or `upi://pay?…` string. Returns null without a valid `pa`. */
export function parseUpi(input: string | URLSearchParams | Record<string, string | string[] | undefined>): Upi | null {
  let src: URLSearchParams;
  if (typeof input === "string") {
    const m = /^upi:\/\/pay\?(.*)$/is.exec(input.trim());
    src = new URLSearchParams(m ? m[1] : input.replace(/^\?/, ""));
  } else if (input instanceof URLSearchParams) {
    src = input;
  } else {
    src = new URLSearchParams();
    for (const [k, v] of Object.entries(input)) {
      for (const x of Array.isArray(v) ? v : v === undefined ? [] : [v]) src.append(k, x);
    }
  }
  const p = new URLSearchParams();
  for (const [k, v] of src) if (v.trim() !== "") p.append(k, v.trim());
  const pa = p.get("pa") ?? "";
  if (!/^[^@\s]+@[^@\s]+$/.test(pa)) return null;
  if (!p.get("cu")) p.set("cu", "INR");
  const qs = [...p].map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
  return {
    qs,
    pa,
    pn: p.get("pn") ?? "",
    am: p.get("am") ?? "",
    cu: p.get("cu") ?? "INR",
    tr: p.get("tr") ?? "",
    tn: p.get("tn") ?? "",
  };
}

export const upiString = (u: Upi) => `upi://pay?${u.qs}`;
export const appHref = (a: UpiApp, u: Upi) => a.scheme + u.qs;

/** Paise-exact amount, or null if `am` is missing or not a number. */
export function amountOf(u: Upi): number | null {
  if (!u.am) return null;
  const n = Number(u.am);
  return Number.isFinite(n) ? n : null;
}

export function formatMoney(n: number, cu = "INR"): string {
  const s = Math.abs(n).toLocaleString("en-IN", {
    minimumFractionDigits: n % 1 ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return (n < 0 ? "−" : "") + (cu === "INR" ? "₹" : `${cu} `) + s;
}

export function initial(s: string): string {
  const m = s.match(/\p{L}|\p{N}/u);
  return (m ? m[0] : "₹").toUpperCase();
}
