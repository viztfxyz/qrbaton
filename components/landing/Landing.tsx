"use client";

import {
  ArrowRight,
  BellRing,
  Bot,
  Braces,
  Check,
  Copy,
  KeyRound,
  Laptop,
  ListChecks,
  MessageSquareText,
  Plug,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Terminal,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import posthog from "posthog-js";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { FAQ, SITE } from "@/lib/site";
import { QrTool } from "../QrTool";
import { StoryDemo } from "./StoryDemo";

const ease = [0.16, 1, 0.3, 1] as const;
const NAME = SITE.name;

const reveal = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, ease },
};

function useOrigin() {
  const [o, setO] = useState("https://your-deployment.example");
  useEffect(() => setO(location.origin), []);
  return o;
}

export function Landing() {
  const origin = useOrigin();
  return (
    <div className="relative isolate overflow-x-clip">
      <Backdrop />
      <Nav />
      <header className="mx-auto max-w-6xl px-5 pt-10 pb-12 text-center sm:pt-14">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="mx-auto inline-flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-[12.5px] font-semibold text-mute shadow-card"
        >
          <Bot className="size-3.5" /> For AI agents that shop for you
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.05 }}
          className="mx-auto mt-6 max-w-4xl text-[clamp(2.4rem,5.6vw,4.1rem)] leading-[0.98] font-bold tracking-[-0.045em] text-balance"
        >
          Your agent shops on a desktop.
          <span className="block bg-gradient-to-r from-[#0b9a5c] via-[#1a7f6e] to-[#4285F4] bg-clip-text text-transparent">You pay with one tap.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.12 }}
          className="mx-auto mt-5 max-w-2xl text-[17px] leading-relaxed text-mute text-pretty"
        >
          At checkout your agent hits a UPI QR it can’t pay. {NAME} turns that QR and the cart into a pay page on your phone. Open the link, check the order, tap Pay, and your UPI app opens with everything filled in.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.2 }}
          className="mt-7 flex flex-wrap justify-center gap-3"
        >
          <a href="/demo" className="group flex h-12 items-center gap-2 rounded-2xl bg-ink px-5 text-[15px] font-semibold text-canvas transition active:scale-[0.98]">
            Open the demo on your phone <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </a>
          <a href="#agents" className="flex h-12 items-center gap-2 rounded-2xl bg-card px-5 text-[15px] font-semibold shadow-card transition active:scale-[0.98]">
            Connect your agent
          </a>
        </motion.div>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-16" aria-label="How it works">
        <StoryDemo />
      </section>

      <BeforeAfter />
      <Agents origin={origin} />
      <Features />

      <section id="try" className="mx-auto max-w-6xl px-5 py-20">
        <SectionHead index="04" eyebrow="No agent? No problem" title="Got a QR screenshot already?" sub="Drop it here and get a link that opens straight in your UPI app. It’s decoded in your browser and never uploaded." />
        <div className="mt-10">
          <QrTool />
        </div>
      </section>

      <Faq />

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-[13px] text-mute sm:flex-row">
          <span className="flex items-center gap-2 font-semibold text-ink">
            <Logo /> {NAME}
          </span>
          <span>Never touches your money. Payments happen inside your own UPI app.</span>
          <span className="flex gap-4">
            <a href="/llms.txt" className="hover:text-ink">llms.txt</a>
            <a href="/openapi.json" className="hover:text-ink">OpenAPI</a>
            <a href="/SKILL.md" className="hover:text-ink">SKILL.md</a>
          </span>
        </div>
      </footer>
    </div>
  );
}

/** Faint grid fading out from the top, with a soft green/blue glow behind the devices. */
function Backdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[1300px]">
      <div
        className="absolute inset-0 opacity-70 [background-image:linear-gradient(to_right,var(--color-line)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-line)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_35%,black,transparent)]"
      />
      <div className="absolute top-[640px] left-1/2 h-[420px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(11_154_92/0.16),transparent)] blur-2xl" />
      <div className="absolute top-[560px] left-[62%] h-[300px] w-[420px] rounded-full bg-[radial-gradient(closest-side,rgb(66_133_244/0.14),transparent)] blur-2xl" />
    </div>
  );
}

function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-16 px-5 py-20">
      <SectionHead index="05" eyebrow="FAQ" title="Questions people ask" />
      <div className="mt-10 space-y-2.5">
        {FAQ.map((f) => (
          <motion.details key={f.q} {...reveal} className="group card px-5 py-1 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3.5 text-[15.5px] font-semibold tracking-tight">
              {f.q}
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-soft text-mute transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="pb-4 text-[14.5px] leading-relaxed text-mute">{f.a}</p>
          </motion.details>
        ))}
      </div>
    </section>
  );
}

function Logo() {
  return (
    <span className="relative grid size-7 place-items-center rounded-[9px] bg-ink text-canvas">
      <ScanLine className="size-4" strokeWidth={2} />
      <span className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-canvas bg-save" />
    </span>
  );
}

function Nav() {
  return (
    <nav className="sticky top-0 z-30 border-b border-transparent bg-canvas/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <a href="/" className="flex items-center gap-2 text-[15px] font-bold tracking-tight">
          <Logo /> {NAME}
        </a>
        <div className="flex items-center gap-1 text-[13.5px] font-semibold text-mute">
          <a href="#agents" className="hidden rounded-lg px-3 py-1.5 hover:text-ink sm:block">For agents</a>
          <a href="#try" className="hidden rounded-lg px-3 py-1.5 hover:text-ink sm:block">Try it</a>
          <a href="#faq" className="hidden rounded-lg px-3 py-1.5 hover:text-ink md:block">FAQ</a>
          <a href="/demo" className="rounded-xl bg-ink px-3.5 py-1.5 text-canvas">Demo</a>
        </div>
      </div>
    </nav>
  );
}

function SectionHead({ index, eyebrow, title, sub }: { index?: string; eyebrow: string; title: string; sub?: string }) {
  return (
    <motion.div {...reveal} className="mx-auto max-w-2xl text-center">
      <p className="text-[12px] font-semibold tracking-[0.14em] text-mute uppercase">
        {index && <span className="mr-2 font-mono tracking-normal text-faint">[{index}]</span>}
        {eyebrow}
      </p>
      <h2 className="mt-3 text-[clamp(1.9rem,4vw,2.8rem)] leading-[1.05] font-bold tracking-[-0.035em] text-balance">{title}</h2>
      {sub && <p className="mt-4 text-[16px] leading-relaxed text-mute text-pretty">{sub}</p>}
    </motion.div>
  );
}

const BEFORE = [
  "Agent screenshots the QR and sends it",
  "You save the image to your gallery",
  "Open your UPI app, find “scan from gallery”",
  "Pick the screenshot, hope it decodes",
  "Type the amount, guess what it was for",
  "Tell the agent you paid, then wait",
];

function BeforeAfter() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20">
      <SectionHead index="01" eyebrow="Why this exists" title="Six annoying steps, or one tap." sub="Agents work on desktops. UPI lives on your phone. Every agent checkout used to end in a screenshot relay." />
      <div className="mt-12 grid gap-4 md:grid-cols-2">
        <motion.div {...reveal} className="card p-6">
          <p className="flex items-center gap-2 text-[13px] font-semibold text-bad">
            <X className="size-4" /> Before
          </p>
          <ol className="mt-4 space-y-3">
            {BEFORE.map((s, i) => (
              <li key={s} className="flex items-center gap-3 text-[14.5px] text-mute">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-soft text-[11.5px] font-bold text-faint tabular">{i + 1}</span>
                <span className="decoration-bad/40 decoration-2 line-through">{s}</span>
              </li>
            ))}
          </ol>
        </motion.div>
        <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.1 }} className="relative overflow-hidden rounded-3xl bg-ink p-6 text-canvas">
          <p className="flex items-center gap-2 text-[13px] font-semibold text-save-soft">
            <Check className="size-4" /> With {NAME}
          </p>
          <p className="mt-6 text-[clamp(3rem,8vw,5.5rem)] leading-none font-bold tracking-[-0.05em]">1 tap.</p>
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed opacity-75">
            Your agent sends one link. You see exactly what you’re paying for, tap Pay, and approve it in your UPI app. Your agent hears back right away.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-[12px] font-semibold">
            {["GPay", "PhonePe", "Paytm", "BHIM", "any UPI app"].map((a) => (
              <span key={a} className="rounded-full bg-white/10 px-3 py-1">
                {a}
              </span>
            ))}
          </div>
          <span className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-save/40 blur-3xl" />
        </motion.div>
      </div>
    </section>
  );
}

function Agents({ origin }: { origin: string }) {
  const tabs = [
    {
      k: "Claude Code",
      icon: Terminal,
      desc: "One line. Then ask it to shop for you; it sends a pay link at checkout.",
      file: "terminal",
      code: `claude mcp add --transport http ${NAME} ${origin}/mcp`,
    },
    {
      k: "Any MCP client",
      icon: Plug,
      desc: "Claude Desktop, Cursor, Codex… Tools: create_pay_link, get_payment_status, set_payment_status.",
      file: "mcp.json",
      code: JSON.stringify({ mcpServers: { [NAME]: { type: "http", url: `${origin}/mcp` } } }, null, 2),
    },
    {
      k: "HTTP",
      icon: Braces,
      desc: "No key, no sign-up. Send the QR image, a upi:// string, or plain {pa, pn, am}.",
      file: "curl",
      code: `curl ${origin}/api/sessions \\
  -F qr=@checkout-qr.png \\
  -F 'order={"merchant":"Blinkit","agent":"Claude","total":642,
    "items":[{"name":"Hass Avocado","qty":1,"price":149}]}'

# → {"url":"${origin}/p/k3Xq…","manageToken":"…"}`,
    },
    {
      k: "Just a prompt",
      icon: MessageSquareText,
      desc: "For agents with web access but no MCP. Paste into its instructions.",
      file: "instructions.md",
      code: `When a checkout shows a UPI QR, don't send me a screenshot.
Read ${origin}/SKILL.md, create a pay link with the QR
and the cart, and send me only the link.
After I pay, check the status and finish the order.`,
    },
  ];
  const [i, setI] = useState(0);
  const t = tabs[i];

  return (
    <section id="agents" className="mx-auto max-w-6xl scroll-mt-16 px-5 py-20">
      <SectionHead index="02" eyebrow="For agents" title="Thirty seconds to connect." sub="Built to be called by agents: no API keys, forgiving input, and errors that say exactly what to fix." />
      <motion.div {...reveal} className="mx-auto mt-10 grid max-w-5xl overflow-hidden rounded-3xl bg-card shadow-card md:grid-cols-[300px_1fr]">
        <div className="flex gap-1 overflow-x-auto border-b border-line p-2 md:flex-col md:border-r md:border-b-0" role="tablist" aria-orientation="vertical">
          {tabs.map((x, n) => (
            <button
              key={x.k}
              type="button"
              role="tab"
              aria-selected={n === i}
              onClick={() => {
                setI(n);
                posthog.capture("agent_setup_tab_selected", { method: x.k });
              }}
              className="relative shrink-0 rounded-2xl p-3.5 text-left md:shrink"
            >
              {n === i && <motion.span layoutId="agent-tab" className="absolute inset-0 rounded-2xl bg-soft" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
              <span className={cn("relative flex items-center gap-2 text-[14px] font-semibold", n === i ? "text-ink" : "text-mute")}>
                <x.icon className="size-4" /> {x.k}
              </span>
              <span className="relative mt-1 hidden text-[12.5px] leading-snug text-mute md:block">{x.desc}</span>
            </button>
          ))}
        </div>
        <div className="flex min-w-0 flex-col bg-[#14130f] text-[#f5f4f0]">
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
            <span className="flex gap-1.5">
              {[0, 1, 2].map((d) => (
                <span key={d} className="size-2.5 rounded-full bg-white/15" />
              ))}
            </span>
            <span className="ml-2 font-mono text-[12px] text-white/50">{t.file}</span>
            <button
              type="button"
              onClick={() => {
                posthog.capture("agent_setup_copied", { method: t.k });
                void navigator.clipboard?.writeText(t.code).then(() => toast.success("Copied"));
              }}
              className="ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12.5px] font-semibold text-white/60 hover:bg-white/10 hover:text-white"
            >
              <Copy className="size-3.5" /> Copy
            </button>
          </div>
          <AnimatePresence mode="wait">
            <motion.pre
              key={t.k}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="min-h-[150px] flex-1 overflow-x-auto p-5 font-mono text-[12.5px] leading-relaxed break-all whitespace-pre-wrap md:min-h-[220px] md:text-[13px] md:break-normal md:whitespace-pre"
            >
              <code>
                {t.file === "terminal" && <span className="text-save-soft select-none">$ </span>}
                {t.code}
              </code>
            </motion.pre>
          </AnimatePresence>
          <p className="border-t border-white/10 px-5 py-3 text-[12.5px] text-white/55 md:hidden">{t.desc}</p>
        </div>
      </motion.div>
    </section>
  );
}

const FEATURES = [
  { icon: ScanLine, title: "Reads any UPI QR", body: "Screenshots, phone photos, crops. Decoded on the server, so your agent just sends the image." },
  { icon: ListChecks, title: "The whole cart, not just a number", body: "Items, prices, discounts, delivery slot and address, so you know what you’re paying for." },
  { icon: Smartphone, title: "Opens your UPI app directly", body: "GPay, PhonePe, Paytm or any UPI app, with payee, amount and note filled in. It remembers your favourite." },
  { icon: BellRing, title: "Your agent hears back", body: "Live status, an “I’ve paid” button with UTR, and signed webhooks. No “did you pay yet?”." },
  { icon: Laptop, title: "Opened it on a laptop?", body: "The page shows a fresh UPI QR to scan with your phone. Same payee, same amount." },
  { icon: KeyRound, title: "No keys, no accounts", body: "One HTTP call or MCP tool. Links expire on their own, and only the creator can change the status." },
  { icon: ShieldCheck, title: "Never touches money", body: "It only builds the link. The payment happens in your UPI app, which shows the real payee before you enter your PIN." },
  { icon: Bot, title: "Agent-native docs", body: "llms.txt, OpenAPI, an MCP server and an installable SKILL.md, all served by the app itself." },
];

function Features() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20">
      <SectionHead index="03" eyebrow="What’s inside" title="Small tool. Sweated details." />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f, i) => (
          <motion.div key={f.title} {...reveal} transition={{ ...reveal.transition, delay: (i % 4) * 0.06 }} className="card p-5">
            <span className="grid size-10 place-items-center rounded-xl bg-soft">
              <f.icon className="size-5" />
            </span>
            <h3 className="mt-4 text-[15.5px] font-semibold tracking-tight">{f.title}</h3>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-mute">{f.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
