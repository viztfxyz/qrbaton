"use client";

import { AlertCircle, Clock3 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import { cn } from "@/lib/cn";

const ease = [0.16, 1, 0.3, 1] as const;

/** Full-screen "paid" moment: drawn ring + check, amount, confetti. */
export function PaidScreen({ amount, merchant, claimed }: { amount: string | null; merchant: string; /** Who was told about an "I've paid" claim. */ claimed?: string }) {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    void import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;
      const colors = ["#0b9a5c", "#6ee7a8", "#fdb022", "#4285F4", "#ffffff"];
      confetti({ particleCount: 90, spread: 70, startVelocity: 42, origin: { y: 0.42 }, colors, disableForReducedMotion: true });
      setTimeout(() => confetti({ particleCount: 50, spread: 110, origin: { y: 0.4 }, colors, scalar: 0.8 }), 220);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <motion.div
      role="status"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-30 flex flex-col items-center justify-center bg-canvas px-8 text-center"
    >
      <svg viewBox="0 0 120 120" className="size-32" aria-hidden="true">
        <circle cx="60" cy="60" r="52" fill="none" strokeWidth="8" className="stroke-save-soft" />
        <motion.circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          className="stroke-save"
          style={{ rotate: -90, transformOrigin: "50% 50%" }}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.7, ease }}
        />
        <motion.path
          d="M40 61.5 54 75 81 46"
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-save"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.55, duration: 0.4, ease }}
        />
      </svg>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.5, ease }}>
        {amount && <p className="mt-7 text-5xl font-bold tracking-tighter tabular">{amount}</p>}
        <h1 className="mt-3 text-xl font-semibold tracking-tight">{claimed ? "Marked as paid" : "Payment received"}</h1>
        <p className="mx-auto mt-1.5 max-w-xs text-[15px] text-mute">
          {claimed ? `We’ve let ${claimed} know. You can close this page.` : `${merchant} is confirming your order. You can close this page.`}
        </p>
      </motion.div>
    </motion.div>
  );
}

export function NoticeCard({ tone, title, body }: { tone: "bad" | "warn"; title: string; body: string }) {
  const Icon = tone === "bad" ? AlertCircle : Clock3;
  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ease, duration: 0.45 }}
      className={cn("flex gap-3 rounded-3xl p-4", tone === "bad" ? "bg-bad-soft text-bad" : "bg-warn-soft text-warn")}
    >
      <Icon className="mt-0.5 size-5 shrink-0" />
      <div>
        <p className="text-[15px] font-semibold">{title}</p>
        <p className="mt-0.5 text-[13.5px] text-mute">{body}</p>
      </div>
    </motion.div>
  );
}
