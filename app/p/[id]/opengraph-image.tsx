import { OG_SIZE, ogCard } from "@/lib/og";
import { getSession } from "@/lib/store";
import { amountOf, formatMoney, parseUpi } from "@/lib/upi";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "UPI payment request";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const s = await getSession((await params).id).catch(() => null);
  const upi = s && parseUpi(s.upi);
  if (!s || !upi || s.status === "expired") return ogCard({ eyebrow: "UPI payment", title: "Payment link expired", sub: "Start a new payment" });
  const am = amountOf(upi);
  const count = s.order?.items.reduce((n, i) => n + i.qty, 0);
  return ogCard({
    eyebrow: s.order ? `${s.order.merchant} order` : "Pay to",
    logoName: s.order?.merchant ?? (upi.pn || upi.pa),
    title: s.order ? `Pay ${s.order.merchant}` : upi.pn || upi.pa,
    amount: am !== null ? formatMoney(am, upi.cu) : undefined,
    sub: count ? `${count} ${count === 1 ? "item" : "items"} · tap to pay with any UPI app` : "Tap to pay with any UPI app",
  });
}
