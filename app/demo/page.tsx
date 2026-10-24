import type { Metadata } from "next";
import { connection } from "next/server";
import { PayView } from "@/components/PayView";
import { DEMO_ORDER, DEMO_UPI } from "@/lib/demo";
import { parseUpi } from "@/lib/upi";
import { DEMO_ID } from "@/lib/useSessionStatus";

export const metadata: Metadata = {
  title: "Demo · Pay ₹642 · Blinkit",
  description: "What your agent sends you: review the cart, tap once, pay in your UPI app.",
  alternates: { canonical: "/demo" },
};

export default async function DemoPage() {
  await connection(); // fresh 30-minute timer per visit
  const upi = parseUpi(DEMO_UPI)!;
  return <PayView demo upi={upi} order={DEMO_ORDER} session={{ id: DEMO_ID, status: "pending", expiresAt: Date.now() + 30 * 60_000 }} />;
}
