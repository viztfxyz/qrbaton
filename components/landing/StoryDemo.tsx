"use client";

import { Bot, Check, Fingerprint, MousePointer2, ScanLine } from "lucide-react";
import { AnimatePresence, motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { DEMO_UPI } from "@/lib/demo";
import { QrCode } from "../QrCode";
import { MerchantLogo } from "../pay/MerchantLogo";

const ease = [0.16, 1, 0.3, 1] as const;

const STEPS = [
  { t: "Your agent reaches checkout", d: "The site shows a UPI QR. On a desktop, it’s stuck there." },
  { t: "It reads the QR and the cart", d: "One API call or MCP tool call with the QR image and the order." },
  { t: "You get one link", d: "On WhatsApp, Telegram, wherever your agent talks to you." },
  { t: "Review and tap Pay", d: "Items, bill and payee on one page. No screenshots, no gallery." },
  { t: "Your UPI app opens, pre-filled", d: "GPay, PhonePe, Paytm or any UPI app. Enter your PIN." },
  { t: "Paid. Agent finishes the order", d: "The page flips to paid and your agent gets told." },
];
const STEP_MS = 2600;

/** Six-beat loop: agent on a laptop hits a UPI QR → link to phone → one tap → paid. */
export function StoryDemo() {
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const visible = useInView(root, { amount: 0.3 });

  useEffect(() => {
    if (paused || !visible) return;
    const h = setTimeout(() => setStep((s) => (s + 1) % STEPS.length), step === STEPS.length - 1 ? STEP_MS + 1200 : STEP_MS);
    return () => clearTimeout(h);
  }, [step, paused, visible]);

  return (
    <div ref={root} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} className="relative">
      <div className="relative flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-center lg:gap-0">
        <Laptop step={step} />
        <Courier step={step} />
        <Phone step={step} />
      </div>

      <ol className="mx-auto mt-10 grid max-w-4xl grid-cols-6 gap-2" aria-label="How it works">
        {STEPS.map((s, i) => (
          <li key={s.t}>
            <button type="button" onClick={() => setStep(i)} className="group block w-full py-2 text-left" aria-current={i === step}>
              <span className="block h-1 overflow-hidden rounded-full bg-line">
                <motion.span
                  key={`${i}-${step}-${paused}`}
                  className="block h-full rounded-full bg-ink"
                  initial={{ width: i < step ? "100%" : "0%" }}
                  animate={{ width: i < step ? "100%" : i === step ? (paused ? "50%" : "100%") : "0%" }}
                  transition={{ duration: i === step && !paused ? STEP_MS / 1000 : 0.2, ease: "linear" }}
                />
              </span>
              <span className={cn("mt-2 hidden text-[12px] leading-tight font-semibold transition-colors sm:block", i === step ? "text-ink" : "text-faint group-hover:text-mute")}>
                {s.t}
              </span>
            </button>
          </li>
        ))}
      </ol>
      <AnimatePresence mode="wait">
        <motion.p
          key={step}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3, ease }}
          className="mx-auto mt-3 max-w-xl text-center text-[14.5px] text-mute"
          aria-live="polite"
        >
          <span className="font-semibold text-ink sm:hidden">{STEPS[step].t}. </span>
          {STEPS[step].d}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

function Laptop({ step }: { step: number }) {
  return (
    <div className="relative z-[1] w-full max-w-[560px]">
      <div className="rounded-t-[18px] border-[10px] border-b-0 border-[#1d1c18] bg-[#1d1c18] shadow-[0_40px_80px_-30px_rgb(22_21_15/0.45)] dark:border-[#2a2925] dark:bg-[#2a2925]">
        <div className="overflow-hidden rounded-[6px] bg-card">
          {/* browser chrome */}
          <div className="flex items-center gap-2 border-b border-line bg-soft px-3 py-2">
            <span className="flex gap-1.5">
              {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
                <span key={c} className="size-2.5 rounded-full" style={{ background: c }} />
              ))}
            </span>
            <span className="mx-auto flex h-5 w-1/2 items-center justify-center rounded-md bg-card text-[10.5px] text-mute">blinkit.com/checkout</span>
          </div>
          <div className="relative grid grid-cols-[1.25fr_1fr] gap-4 p-4 sm:p-5">
            <div className="space-y-2.5">
              <p className="text-[12px] font-bold tracking-tight">Checkout · 7 items</p>
              {["Amul Taaza Milk ×3", "Hass Avocado", "Whole Wheat Bread", "Attikan Estate Coffee"].map((t, i) => (
                <div key={t} className="flex items-center gap-2">
                  <span className="size-6 shrink-0 rounded-md bg-soft" />
                  <span className="flex-1 truncate text-[10.5px] text-mute">{t}</span>
                  <span className="h-1.5 w-6 rounded-full bg-line" style={{ opacity: 1 - i * 0.15 }} />
                </div>
              ))}
              <div className="flex justify-between border-t border-dashed border-line pt-2 text-[11px] font-bold">
                <span>To pay</span>
                <span className="tabular">₹642</span>
              </div>
            </div>
            <div className="relative flex flex-col items-center rounded-xl border border-line p-3">
              <p className="mb-2 text-[10px] font-semibold text-mute">Scan to pay with UPI</p>
              <div className="relative w-full max-w-[120px] overflow-hidden rounded-md bg-white p-1.5">
                <QrCode value={DEMO_UPI} className="w-full" />
                <AnimatePresence>
                  {step === 1 && (
                    <motion.span
                      initial={{ top: "-20%" }}
                      animate={{ top: ["-20%", "100%", "-20%"] }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.8, ease: "easeInOut" }}
                      className="absolute inset-x-0 h-6 bg-gradient-to-b from-transparent via-[#4285F4]/45 to-transparent"
                    />
                  )}
                </AnimatePresence>
              </div>
              <p className="mt-2 text-[11px] font-bold tabular">₹642.00</p>
            </div>

            {/* agent cursor */}
            <motion.div
              className="pointer-events-none absolute top-0 left-0"
              initial={false}
              animate={step === 0 ? { x: 70, y: 150 } : step <= 2 ? { x: 330, y: 105 } : { x: 300, y: 175 }}
              transition={{ duration: 1.1, ease }}
            >
              <MousePointer2 className="size-5 fill-ink text-card" strokeWidth={1.5} />
              <span className="mt-0.5 ml-3 flex items-center gap-1 rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap text-canvas">
                <Bot className="size-3" />
                {step === 0 ? "Checking out…" : step === 1 ? "Reading QR + cart…" : step <= 4 ? "Waiting for payment" : "Placing order ✓"}
              </span>
            </motion.div>

            <AnimatePresence>
              {step === 5 && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease }}
                  className="absolute inset-x-6 bottom-4 flex items-center gap-2 rounded-xl bg-save px-3 py-2 text-[11.5px] font-semibold text-white shadow-card dark:text-canvas"
                >
                  <Check className="size-4" strokeWidth={3} /> Payment confirmed. Order placed, arriving in 11 min.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <div className="relative mx-auto h-3 w-[108%] -translate-x-[3.7%] rounded-b-2xl bg-gradient-to-b from-[#d9d6cf] to-[#b9b5ac] dark:from-[#3a3934] dark:to-[#2a2925]">
        <span className="absolute top-0 left-1/2 h-1.5 w-20 -translate-x-1/2 rounded-b-lg bg-black/10" />
      </div>
    </div>
  );
}

/** The link flying from the laptop to the phone (wide layouts only). */
function Courier({ step }: { step: number }) {
  return (
    <div className="pointer-events-none relative hidden h-[300px] w-24 lg:block">
      <svg className="absolute inset-0 size-full overflow-visible" viewBox="0 0 96 300" fill="none" aria-hidden="true">
        <path d="M-10 140 C 30 60, 70 60, 110 120" stroke="currentColor" strokeDasharray="3 6" className="text-line" strokeWidth="2" />
      </svg>
      <AnimatePresence>
        {step === 2 && (
          <motion.span
            initial={{ offsetDistance: "0%", opacity: 0, scale: 0.6 }}
            animate={{ offsetDistance: "100%", opacity: [0, 1, 1, 0], scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: "easeInOut" }}
            style={{ offsetPath: "path('M-10 140 C 30 60, 70 60, 110 120')" }}
            className="absolute top-0 left-0 flex items-center gap-1 rounded-full bg-ink px-2.5 py-1 text-[10.5px] font-semibold whitespace-nowrap text-canvas shadow-card"
          >
            🔗 pay link
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

function Phone({ step }: { step: number }) {
  return (
    <div className="relative z-[2] w-[250px] shrink-0 rounded-[44px] bg-[#1d1c18] p-[9px] shadow-[0_40px_80px_-24px_rgb(22_21_15/0.5)] dark:bg-[#2a2925]">
      <div className="relative h-[510px] overflow-hidden rounded-[36px] bg-canvas">
        <span className="absolute top-2.5 left-1/2 z-20 h-[22px] w-[78px] -translate-x-1/2 rounded-full bg-[#1d1c18]" />
        <AnimatePresence mode="popLayout" initial={false}>
          {step <= 2 && <LockScreen key="lock" notify={step === 2} />}
          {step === 3 && <MiniPay key="pay" />}
          {step === 4 && <UpiApp key="upi" />}
          {step === 5 && <Done key="done" />}
        </AnimatePresence>
      </div>
    </div>
  );
}

const screen = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 1.02 },
  transition: { duration: 0.45, ease },
};

function LockScreen({ notify }: { notify: boolean }) {
  return (
    <motion.div {...screen} className="absolute inset-0 bg-gradient-to-b from-[#c9d6ff] via-[#e2d1f9] to-[#fbe3d2] px-3 pt-16 text-center text-[#16150f]">
      <p className="text-[13px] font-semibold opacity-70">Saturday, 24 October</p>
      <p className="text-[64px] leading-none font-bold tracking-tight tabular">9:41</p>
      <AnimatePresence>
        {notify && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 24, delay: 0.7 }}
            className="mt-8 flex gap-2.5 rounded-[22px] bg-white/75 p-3 text-left shadow-lg backdrop-blur-xl"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#25D366] text-white">
              <Bot className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="flex justify-between text-[12px] font-semibold">
                Claude <span className="font-normal opacity-50">now</span>
              </span>
              <span className="block text-[12px] leading-snug">Your Blinkit order is ready. ₹642 — tap to review and pay.</span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MiniPay() {
  return (
    <motion.div {...screen} className="absolute inset-0 px-3.5 pt-12">
      <div className="flex items-center gap-2">
        <MerchantLogo name="Blinkit" className="size-8 rounded-xl" />
        <div className="text-left">
          <p className="text-[8.5px] font-semibold tracking-[0.12em] text-mute uppercase">Review & pay</p>
          <p className="text-[12.5px] font-semibold">Blinkit order</p>
        </div>
      </div>
      <p className="mt-5 text-center text-[40px] leading-none font-bold tracking-[-0.04em] tabular">₹642</p>
      <p className="mt-1 text-center text-[10.5px] text-mute">
        7 items · <span className="font-semibold text-save">₹14 saved</span>
      </p>
      <div className="card mt-4 space-y-2 p-3">
        {["Amul Taaza Milk", "Hass Avocado", "Attikan Coffee"].map((t, i) => (
          <div key={t} className="flex items-center gap-2">
            <span className="size-7 rounded-lg bg-soft" />
            <span className="flex-1 text-[10.5px] font-medium">{t}</span>
            <span className="text-[10.5px] font-semibold tabular">₹{[168, 149, 245][i]}</span>
          </div>
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 rounded-t-[20px] bg-card px-3 pt-2.5 pb-4 shadow-float">
        <p className="text-[9.5px] text-mute">
          Pay using <span className="font-semibold text-ink">PhonePe</span>
        </p>
        <div className="relative mt-1.5 flex h-10 items-center justify-between overflow-hidden rounded-xl bg-ink px-3 text-[12px] font-semibold text-canvas">
          <span className="tabular">₹642</span> Pay now ›
          <motion.span
            className="absolute top-1/2 right-10 size-10 -translate-y-1/2 rounded-full bg-white/40"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.6], opacity: [0.8, 0] }}
            transition={{ delay: 1.4, duration: 0.6 }}
          />
        </div>
      </div>
      <motion.span
        className="absolute right-12 bottom-3 grid size-10 place-items-center rounded-full bg-black/10 text-ink"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: [0, 1, 1, 0], y: [30, 0, 0, 0], scale: [1, 1, 0.85, 1] }}
        transition={{ delay: 0.6, duration: 1.6, times: [0, 0.4, 0.6, 1] }}
      >
        <Fingerprint className="size-5" />
      </motion.span>
    </motion.div>
  );
}

function UpiApp() {
  return (
    <motion.div {...screen} initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col bg-[#f4effb] pt-12">
      <div className="px-4 text-left">
        <p className="text-[11px] font-semibold text-[#5f259f]">PhonePe</p>
        <p className="mt-3 text-[12px] text-[#5b5470]">Paying</p>
        <p className="text-[15px] font-bold text-[#1f1633]">Blinkit</p>
        <p className="font-mono text-[10px] text-[#5b5470]">blinkit.payu@hdfcbank</p>
        <p className="mt-3 text-[34px] font-bold tracking-tight text-[#1f1633] tabular">₹642</p>
      </div>
      <div className="mt-auto rounded-t-[22px] bg-white px-4 pt-4 pb-6 text-center">
        <p className="text-[11px] font-semibold text-[#5b5470]">ENTER UPI PIN</p>
        <div className="mt-3 flex justify-center gap-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <motion.span
              key={i}
              className="size-3 rounded-full border-2 border-[#5f259f]"
              initial={{ backgroundColor: "#ffffff" }}
              animate={{ backgroundColor: "#5f259f" }}
              transition={{ delay: 0.5 + i * 0.22, duration: 0.1 }}
            />
          ))}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-1.5 text-[13px] font-semibold text-[#1f1633]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <span key={n} className="rounded-lg bg-[#f4effb] py-1.5">
              {n}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function Done() {
  return (
    <motion.div {...screen} className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
      <svg viewBox="0 0 120 120" className="size-24" aria-hidden="true">
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
          transition={{ delay: 0.5, duration: 0.4, ease }}
        />
      </svg>
      <p className="mt-5 text-[30px] font-bold tracking-tight tabular">₹642</p>
      <p className="mt-1 text-[14px] font-semibold">Payment received</p>
      <p className="mt-1 text-[11.5px] text-mute">Claude is placing your order.</p>
      <span className="mt-6 flex items-center gap-1.5 rounded-full bg-soft px-3 py-1.5 text-[10.5px] font-semibold text-mute">
        <ScanLine className="size-3.5" /> No screenshots were harmed
      </span>
    </motion.div>
  );
}
