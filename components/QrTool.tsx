"use client";

import { ArrowRight, Copy, Link2, Loader2, ScanLine } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { parseUpi } from "@/lib/upi";

type Msg = { kind: "err" | "busy"; text: string } | null;
const ease = [0.16, 1, 0.3, 1] as const;

async function decodeQr(file: File): Promise<string | null> {
  const { default: jsQR } = await import("jsqr");
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
      img.src = url;
    });
    for (const max of [1600, 1000, 600, 2400]) {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * s);
      c.height = Math.round(img.height * s);
      const x = c.getContext("2d");
      if (!x) return null;
      x.drawImage(img, 0, 0, c.width, c.height);
      const d = x.getImageData(0, 0, c.width, c.height);
      const code = jsQR(d.data, d.width, d.height, { inversionAttempts: "attemptBoth" });
      if (code) return code.data;
    }
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function Field({ id, label, hint, ...props }: { id: string; label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 flex justify-between px-0.5 text-[12.5px] font-semibold text-mute">
        {label}
        {hint && <span className="font-medium text-faint">{hint}</span>}
      </span>
      <input
        id={id}
        className="h-12 w-full rounded-2xl border border-line bg-soft px-4 text-[16px] outline-none transition placeholder:text-faint focus:border-ink focus:bg-card"
        {...props}
      />
    </label>
  );
}

/** Make a plain pay link from a QR photo or typed details (no backend). */
export function QrTool() {
  const [msg, setMsg] = useState<Msg>(null);
  const [manual, setManual] = useState(false);
  const [out, setOut] = useState<{ err?: string; link?: string }>({});
  const file = useRef<HTMLInputElement>(null);
  const form = useRef<HTMLDivElement>(null);

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setMsg({ kind: "busy", text: "Reading QR…" });
    let data: string | null;
    try {
      data = await decodeQr(f);
    } catch {
      return setMsg({ kind: "err", text: "Could not open that image." });
    }
    if (!data) return setMsg({ kind: "err", text: "No QR code found in that image. Try a clearer, closer photo." });
    const upi = /^upi:\/\/pay\?/i.test(data.trim()) ? parseUpi(data) : null;
    if (!upi) return setMsg({ kind: "err", text: `Not a UPI payment QR (expected upi://pay?pa=…). Found: ${data.slice(0, 120)}` });
    location.href = `/?${upi.qs}`;
  };

  const generate = () => {
    const f = new URLSearchParams();
    for (const k of ["pa", "pn", "am", "tn"]) {
      const v = (form.current?.querySelector<HTMLInputElement>(`#${k}`)?.value ?? "").trim();
      if (v) f.set(k, v);
    }
    if (!f.get("pa")) return setOut({ err: "UPI ID is required." });
    if (!parseUpi(f)) return setOut({ err: "That doesn’t look like a UPI ID (name@bank)." });
    setOut({ link: `${location.origin}/?${f}` });
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease }} className="card p-6 text-center">
        <div className="relative mx-auto mb-5 grid size-24 place-items-center">
          <motion.span
            className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-[#4285F4]/25 via-[#5F259F]/20 to-[#00BAF2]/25 blur-xl"
            animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="relative grid size-20 place-items-center rounded-[26px] bg-ink text-canvas shadow-card">
            <ScanLine className="size-9" strokeWidth={1.6} />
          </span>
        </div>
        <h3 className="text-[26px] font-bold tracking-tight text-balance">Pay any UPI QR in one tap</h3>
        <p className="mx-auto mt-2 max-w-[28ch] text-[15px] text-mute">Upload a merchant’s QR and we’ll open it straight in GPay, PhonePe or Paytm.</p>

        <button
          type="button"
          onClick={() => file.current?.click()}
          className="relative mt-6 flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-ink text-[16.5px] font-semibold text-canvas transition active:scale-[0.985]"
        >
          <ScanLine className="size-5" /> Scan or upload QR
          <span className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-shine bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </button>
        <input
          ref={file}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => {
            void onFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <div role="alert" className="min-h-0">
          {msg && (
            <p className={cn("mt-3 flex items-center justify-center gap-2 text-[13.5px] font-medium", msg.kind === "err" ? "text-bad" : "text-mute")}>
              {msg.kind === "busy" && <Loader2 className="size-4 animate-spin" />}
              {msg.text}
            </p>
          )}
        </div>

        <button type="button" onClick={() => setManual(!manual)} className="mt-3 h-11 w-full text-[14.5px] font-semibold text-mute underline decoration-line underline-offset-4 hover:text-ink">
          {manual ? "Hide manual entry" : "Enter details manually"}
        </button>

        <AnimatePresence initial={false}>
          {manual && (
            <motion.div
              ref={form}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease }}
              className="overflow-hidden text-left"
            >
              <div className="space-y-3 pt-3">
                <Field id="pa" label="UPI ID" hint="Required" placeholder="name@bank" autoCapitalize="off" autoCorrect="off" autoComplete="off" spellCheck={false} />
                <Field id="pn" label="Payee name" placeholder="Payee name" autoComplete="name" />
                <Field id="am" label="Amount" placeholder="₹0" inputMode="decimal" autoComplete="off" />
                <Field id="tn" label="Note" placeholder="What’s it for?" autoComplete="off" />
                <button type="button" onClick={generate} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-ink text-[15.5px] font-semibold text-canvas active:scale-[0.985]">
                  <Link2 className="size-4.5" /> Create pay link
                </button>
                {out.err && <p className="text-[13.5px] font-medium text-bad">{out.err}</p>}
                {out.link && (
                  <div className="rounded-2xl bg-soft p-3">
                    <a href={out.link} className="block break-all font-mono text-[12.5px] text-ink underline-offset-2 hover:underline">
                      {out.link}
                    </a>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => navigator.clipboard?.writeText(out.link!).then(() => toast.success("Link copied"))}
                        className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-card text-[13.5px] font-semibold shadow-card"
                      >
                        <Copy className="size-4" /> Copy
                      </button>
                      <a href={out.link} className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-ink text-[13.5px] font-semibold text-canvas">
                        Open <ArrowRight className="size-4" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <p className="mx-auto mt-5 max-w-xs text-center text-[12.5px] text-mute">Always check the payee name and UPI ID in your UPI app before paying.</p>
    </div>
  );
}
