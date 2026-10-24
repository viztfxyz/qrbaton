"use client";

import NumberFlow from "@number-flow/react";
import { ChevronRight, Loader2, LockKeyhole } from "lucide-react";
import { motion } from "motion/react";
import posthog from "posthog-js";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Order, Status } from "@/lib/order";
import { getLocal, setLocal } from "@/lib/storage";
import { APPS, type AppKey, type Upi, amountOf, appHref, formatMoney, upiString } from "@/lib/upi";
import { type LiveSession, useSessionStatus } from "@/lib/useSessionStatus";
import { AppLogo } from "./AppLogo";
import { QrCode } from "../QrCode";
import { AppSheet } from "./AppSheet";
import { ClaimSheet } from "./ClaimSheet";
import { MerchantLogo } from "./MerchantLogo";
import { NoticeCard, PaidScreen } from "./Outcome";
import { BillCard, DeliveryCard, ItemsCard, PayeeCard, SenderCard, siteHost } from "./sections";

const LAST_KEY = "upiLastApp";
const DEFAULT_APP: AppKey = "p";
const ease = [0.16, 1, 0.3, 1] as const;

interface Props {
  upi: Upi;
  order?: Order | null;
  session?: LiveSession;
  /** Sample page: Pay simulates a payment instead of opening an app. */
  demo?: boolean;
}

function remaining(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  return s >= 120 ? `${Math.ceil(s / 60)} min` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

const rise = (i: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease, delay: 0.04 * i },
});

export function PayScreen({ upi, order, session, demo }: Props) {
  const [status, now, setLive] = useSessionStatus(session);
  const am = amountOf(upi);
  const who = upi.pn || upi.pa;
  const merchant = order?.merchant ?? who;
  const host = siteHost(order?.site);
  const count = order?.items.reduce((n, i) => n + i.qty, 0) ?? 0;
  const saved = order?.charges.reduce((n, c) => n + (c.amount < 0 ? -c.amount : 0), 0) ?? 0;

  const [last, setLast] = useState<AppKey | null>(null);
  const [app, setApp] = useState<AppKey>(DEFAULT_APP);
  const [sheet, setSheet] = useState(false);
  const [opened, setOpened] = useState(false);
  const [shown, setShown] = useState(0);
  const [claimOpen, setClaimOpen] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const sender = order?.agent ?? "the sender";
  // Feature usage only: nothing about the amount, the cart, the payee or whether the payment went through.
  const track = (event: string, props: Record<string, unknown> = {}) => posthog.capture(event, { demo: !!demo, has_order: !!order, ...props });

  useEffect(() => {
    track("pay_page_viewed");
  }, []);

  useEffect(() => {
    const l = getLocal(LAST_KEY) as AppKey | null;
    if (l && APPS.some((a) => a.k === l)) {
      setLast(l);
      setApp(l);
    }
    if (am !== null) setShown(am);
  }, [am]);

  const selected = APPS.find((a) => a.k === app) ?? APPS[0];
  const done = status === "paid" || status === "failed" || status === "expired";

  const pay = (e: React.MouseEvent) => {
    setLocal(LAST_KEY, app);
    setLast(app);
    setOpened(true);
    track("pay_now_clicked", { app: selected.name });
    if (demo) {
      e.preventDefault();
      toast(`Demo: pretending to open ${selected.name}…`, { description: "In real use, your UPI app opens with everything filled in." });
      setTimeout(() => setLive("paid"), 1600);
      return;
    }
    toast(`Opening ${selected.name}…`, { description: "Approve the payment there, then come back here." });
  };

  const claim = async (utr: string | undefined) => {
    if (!session) return;
    if (demo) {
      setClaimed(true);
      return setLive("paid");
    }
    const r = await fetch(`/api/sessions/${session.id}/claim`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(utr ? { utr } : {}),
    });
    const body = (await r.json().catch(() => ({}))) as { status?: Status; error?: string };
    if (!r.ok && r.status !== 409) throw new Error(body.error ?? "Couldn’t send that. Try again.");
    setClaimed(r.ok);
    if (body.status) setLive(body.status);
  };

  if (status === "paid") {
    return <PaidScreen amount={am !== null ? formatMoney(am, upi.cu) : null} merchant={merchant} claimed={claimed ? sender : undefined} />;
  }

  return (
    <>
      <main className="ph-no-capture mx-auto w-full max-w-md px-4 pt-[calc(env(safe-area-inset-top)+20px)] pb-64">
        {/* header */}
        <motion.header {...rise(0)} className="flex items-center gap-3 px-1">
          <MerchantLogo name={merchant} logo={order?.logo} />
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-mute">{order ? "Review & pay" : "Pay to"}</p>
            <p className="truncate text-[17px] font-semibold tracking-tight">{order ? `${merchant} order` : who}</p>
            {host && (
              <a href={order?.site} target="_blank" rel="noopener noreferrer" className="block truncate text-[12.5px] text-mute underline-offset-2 hover:underline">
                {host}
              </a>
            )}
          </div>
          {session && status === "pending" && (
            <span className="flex items-center gap-1.5 rounded-full bg-card px-2.5 py-1 text-[12px] font-semibold text-mute shadow-card tabular">
              <span className="size-1.5 animate-pulse-dot rounded-full bg-save" />
              {remaining(session.expiresAt - now)}
            </span>
          )}
        </motion.header>

        {/* amount */}
        <motion.section {...rise(1)} className="mt-7 mb-6 text-center">
          {am !== null ? (
            <NumberFlow
              value={shown}
              locales="en-IN"
              format={{ style: "currency", currency: upi.cu, maximumFractionDigits: am % 1 ? 2 : 0, minimumFractionDigits: am % 1 ? 2 : 0 }}
              className="text-[64px] leading-none font-bold tracking-[-0.045em] tabular"
              transformTiming={{ duration: 900, easing: "cubic-bezier(.16,1,.3,1)" }}
              spinTiming={{ duration: 900, easing: "cubic-bezier(.16,1,.3,1)" }}
            />
          ) : (
            <p className="text-3xl font-semibold tracking-tight">{upi.am || "Enter amount in your UPI app"}</p>
          )}
          <p className="mt-2 text-[14px] text-mute">
            {order ? (
              <>
                {count} {count === 1 ? "item" : "items"}
                {saved > 0 && (
                  <>
                    {" · "}
                    <span className="font-semibold text-save">{formatMoney(saved, upi.cu)} saved</span>
                  </>
                )}
              </>
            ) : (
              <span className="font-mono text-[13px]">{upi.pa}</span>
            )}
          </p>
        </motion.section>

        <div className="space-y-3">
          {!done && (
            <motion.section {...rise(2)} className="card hidden items-center gap-5 p-5 pointer-fine:flex">
              <QrCode value={upiString(upi)} className="size-32 shrink-0" />
              <div>
                <p className="text-[15px] font-semibold tracking-tight">On a computer?</p>
                <p className="mt-1 text-[13px] leading-snug text-mute">Scan this with any UPI app on your phone. Same payee, same amount, already filled in.</p>
              </div>
            </motion.section>
          )}
          {status === "failed" && (
            <NoticeCard tone="bad" title="Payment didn’t go through" body={`Start a new payment from ${merchant}. If money left your account, your bank reverses it automatically.`} />
          )}
          {status === "expired" && (
            <NoticeCard tone="warn" title="This payment link has expired" body={`Don’t pay with an old link. Start a new payment from ${merchant}.`} />
          )}
          {order && (
            <>
              <motion.div {...rise(2)}>
                <SenderCard order={order} />
              </motion.div>
              <motion.div {...rise(2)}>
                <DeliveryCard order={order} />
              </motion.div>
              <motion.div {...rise(3)}>
                <ItemsCard order={order} cu={upi.cu} />
              </motion.div>
              <motion.div {...rise(4)}>
                <BillCard order={order} cu={upi.cu} />
              </motion.div>
            </>
          )}
          <motion.div {...rise(5)}>
            <PayeeCard upi={upi} order={order} />
          </motion.div>
          <motion.p {...rise(6)} className="flex items-start gap-2 px-2 pt-1 text-[12.5px] leading-relaxed text-mute">
            <LockKeyhole className="mt-0.5 size-3.5 shrink-0" />
            You approve the payment inside your UPI app. Check the payee name and amount there before you enter your PIN.
          </motion.p>
        </div>
      </main>

      {/* sticky pay bar */}
      {!done && (
        <motion.div
          initial={{ y: 120 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 30, delay: 0.25 }}
          className="fixed inset-x-0 bottom-0 z-20"
        >
          <div className="mx-auto w-full max-w-md rounded-t-[28px] bg-card/90 px-4 pt-3 pb-safe shadow-float backdrop-blur-xl">
            <button
              type="button"
              onClick={() => setSheet(true)}
              className="flex w-full items-center gap-3 rounded-2xl px-1.5 py-1.5 text-left transition active:bg-soft"
            >
              <AppLogo k={app} className="size-9 rounded-[10px]" />
              <span className="flex-1">
                <span className="block text-[12px] font-medium text-mute">Pay using</span>
                <span className="block text-[15px] font-semibold tracking-tight">{selected.name}</span>
              </span>
              <span className="flex items-center gap-0.5 text-[13px] font-semibold text-mute">
                Change <ChevronRight className="size-4" />
              </span>
            </button>
            <a
              href={appHref(selected, upi)}
              onClick={pay}
              className="group relative mt-2.5 flex h-14 w-full items-center justify-between overflow-hidden rounded-2xl bg-ink px-5 text-canvas shadow-[0_10px_24px_-10px_rgb(22_21_15/0.6)] transition active:scale-[0.985]"
            >
              <span className="text-left leading-tight">
                {am !== null && <span className="block text-[17px] font-bold tabular">{formatMoney(am, upi.cu)}</span>}
                <span className="block text-[11.5px] font-medium opacity-70">{order ? "TOTAL" : "AMOUNT"}</span>
              </span>
              <span className="flex items-center gap-1.5 text-[16.5px] font-semibold">
                {opened && session ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Waiting…
                  </>
                ) : (
                  <>
                    Pay now <ChevronRight className="size-5 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </span>
              <span className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-shine bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </a>
            {session && (
              <button type="button" onClick={() => setClaimOpen(true)} className="mt-1 h-9 w-full text-[13px] font-semibold text-mute transition hover:text-ink">
                Already paid? Let {sender} know
              </button>
            )}
          </div>
        </motion.div>
      )}

      {session && <ClaimSheet open={claimOpen} onOpenChange={setClaimOpen} who={sender} onClaim={claim} />}

      <AppSheet
        open={sheet}
        onOpenChange={setSheet}
        selected={app}
        last={last}
        onSelect={(k) => {
          if (k !== app) track("upi_app_selected", { app: APPS.find((a) => a.k === k)?.name, previous: selected.name });
          setApp(k);
          setTimeout(() => setSheet(false), 160);
        }}
      />
    </>
  );
}
