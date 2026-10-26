import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PayView } from "@/components/PayView";
import { getSession } from "@/lib/store";
import { amountOf, formatMoney, parseUpi } from "@/lib/upi";

type Params = Promise<{ id: string }>;

async function load(id: string) {
  const s = await getSession(id);
  const upi = s && parseUpi(s.upi);
  return s && upi ? { s, upi } : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const r = await load((await params).id);
  if (!r) return { title: "Payment link expired", robots: { index: false, follow: false } };
  const { s, upi } = r;
  const am = amountOf(upi);
  const who = s.order?.merchant ?? (upi.pn || upi.pa);
  const expired = s.status === "expired";
  const pay = am !== null ? `Pay ${formatMoney(am, upi.cu)} · ${who}` : `Pay ${who}`;
  const title = expired ? `Expired: ${am !== null ? `${formatMoney(am, upi.cu)} · ` : ""}${who}` : pay;
  const count = s.order?.items.reduce((n, i) => n + i.qty, 0);
  return {
    title,
    description: expired
      ? "This payment link has expired"
      : count
        ? `${count} ${count === 1 ? "item" : "items"} · tap to pay with any UPI app`
        : "Tap to pay with any UPI app",
    robots: { index: false, follow: false },
    twitter: { card: "summary_large_image" },
  };
}

export default async function SessionPage({ params }: { params: Params }) {
  const r = await load((await params).id);
  if (!r) notFound();
  const { s, upi } = r;
  return <PayView upi={upi} order={s.order} session={{ id: s.id, status: s.status, expiresAt: s.expiresAt }} />;
}
