"use client";

import { Bot, ChevronDown, Copy, MapPin, Sparkles, Timer } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import type { Order } from "@/lib/order";
import { type Upi, formatMoney, initial } from "@/lib/upi";

const PREVIEW = 3;

export function Section({ title, aside, children, className }: { title?: string; aside?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("card p-5", className)}>
      {title && (
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
          {aside && <span className="text-[13px] text-mute">{aside}</span>}
        </div>
      )}
      {children}
    </section>
  );
}

export function DeliveryCard({ order }: { order: Order }) {
  const slot = order.delivery?.slot;
  const addr = order.delivery?.address;
  if (!slot && !addr?.label && !addr?.text) return null;
  return (
    <section className="card flex gap-3.5 p-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-save-soft text-save">
        {slot ? <Timer className="size-5" /> : <MapPin className="size-5" />}
      </span>
      <div className="min-w-0 flex-1">
        {slot && <p className="text-[15px] font-semibold tracking-tight">Arriving in {slot}</p>}
        {(addr?.label || addr?.text) && (
          <p className="mt-0.5 text-[13px] leading-snug text-mute">
            {addr.label && <span className="font-semibold text-ink">{addr.label}</span>}
            {addr.label && addr.text && " · "}
            {addr.text}
          </p>
        )}
      </div>
    </section>
  );
}

/** `https://www.blinkit.com/cart` → `blinkit.com`. */
export const siteHost = (url?: string) => (url ? new URL(url).hostname.replace(/^www\./, "") : null);

export function SenderCard({ order }: { order: Order }) {
  if (!order.agent && !order.note) return null;
  return (
    <section className="card flex gap-3.5 p-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-soft text-mute">
        <Bot className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold tracking-tight">{order.agent ? `Sent by ${order.agent}` : "Note"}</p>
        {order.note && <p className="mt-0.5 text-[13px] leading-snug whitespace-pre-line text-mute">{order.note}</p>}
      </div>
    </section>
  );
}

function Thumb({ src, name }: { src?: string; name: string }) {
  const [broken, setBroken] = useState(false);
  const img = useRef<HTMLImageElement>(null);
  // The load can fail before hydration attaches onError.
  useEffect(() => {
    const el = img.current;
    if (el?.complete && el.naturalWidth === 0) setBroken(true);
  }, []);
  const box = "size-14 shrink-0 rounded-2xl bg-white shadow-[inset_0_0_0_1px_rgb(22_21_15/0.07)]";
  if (!src || broken) {
    return <span className={cn(box, "grid place-items-center bg-soft text-base font-semibold text-faint")}>{initial(name)}</span>;
  }
  // biome-ignore lint: merchant CDN images; next/image would need every host allowlisted
  return <img ref={img} src={src} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken(true)} className={cn(box, "object-contain p-1")} />;
}

function ItemRow({ item, cu }: { item: Order["items"][number]; cu: string }) {
  const line = item.price * item.qty;
  const mrp = item.mrp && item.mrp > item.price ? item.mrp * item.qty : null;
  return (
    <div className="flex items-center gap-3.5 py-2.5">
      <Thumb src={item.image} name={item.name} />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[14px] font-medium leading-snug tracking-tight">{item.name}</p>
        <p className="mt-0.5 text-[12.5px] text-mute">
          {item.unit && <>{item.unit} · </>}
          <span className="tabular">×{item.qty}</span>
        </p>
      </div>
      <div className="text-right tabular">
        <p className="text-[14px] font-semibold">{formatMoney(line, cu)}</p>
        {mrp && <p className="text-[12px] text-faint line-through">{formatMoney(mrp, cu)}</p>}
      </div>
    </div>
  );
}

export function ItemsCard({ order, cu }: { order: Order; cu: string }) {
  const [all, setAll] = useState(false);
  if (!order.items.length) return null;
  const count = order.items.reduce((n, i) => n + i.qty, 0);
  const head = order.items.slice(0, PREVIEW);
  const rest = order.items.slice(PREVIEW);
  return (
    <Section title="Your order" aside={`${count} ${count === 1 ? "item" : "items"}`}>
      <ul className="-my-2.5 divide-y divide-line">
        {head.map((i, n) => (
          <li key={n}>
            <ItemRow item={i} cu={cu} />
          </li>
        ))}
        <AnimatePresence initial={false}>
          {all &&
            rest.map((i, n) => (
              <motion.li
                key={n}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1], delay: n * 0.03 }}
                className="overflow-hidden"
              >
                <ItemRow item={i} cu={cu} />
              </motion.li>
            ))}
        </AnimatePresence>
      </ul>
      {rest.length > 0 && (
        <button
          type="button"
          onClick={() => setAll(!all)}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-soft py-2.5 text-[13.5px] font-semibold text-ink transition active:scale-[0.99]"
        >
          {all ? "Show less" : `Show ${rest.length} more`}
          <ChevronDown className={cn("size-4 transition-transform", all && "rotate-180")} />
        </button>
      )}
    </Section>
  );
}

export function BillCard({ order, cu }: { order: Order; cu: string }) {
  const saved = order.charges.reduce((n, c) => n + (c.amount < 0 ? -c.amount : 0), 0);
  return (
    <Section title="Bill details">
      <dl className="space-y-2.5 text-[14px]">
        {order.charges.map((c, n) => (
          <div key={n} className="flex items-baseline justify-between gap-4">
            <dt className="text-mute">{c.label}</dt>
            <dd className={cn("font-medium tabular", c.amount < 0 && "text-save", c.amount === 0 && "text-save")}>
              {c.amount === 0 ? "FREE" : formatMoney(c.amount, cu)}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 flex items-baseline justify-between border-t border-dashed border-line pt-4">
        <span className="text-[15px] font-semibold">To pay</span>
        <span className="text-[17px] font-bold tabular">{formatMoney(order.total, cu)}</span>
      </div>
      {saved > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="relative mt-4 flex items-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-save to-[#0b9a5c] px-4 py-3 text-[13.5px] font-semibold text-white dark:from-[#0f5b3a] dark:to-[#137a4d]"
        >
          <Sparkles className="size-4 shrink-0" />
          <span>
            You’re saving <span className="tabular">{formatMoney(saved, cu)}</span> on this order
          </span>
          <span className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-shine bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        </motion.div>
      )}
    </Section>
  );
}

export function PayeeCard({ upi, order }: { upi: Upi; order?: Order | null }) {
  const ref = order?.orderId ? `#${order.orderId}` : upi.tr;
  const copy = () =>
    navigator.clipboard?.writeText(upi.pa).then(
      () => toast.success("UPI ID copied"),
      () => toast.error("Couldn’t copy"),
    );
  return (
    <Section title="Payment to">
      <dl className="space-y-2.5 text-[14px]">
        {upi.pn && (
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-mute">Name</dt>
            <dd className="text-right font-medium">{upi.pn}</dd>
          </div>
        )}
        <div className="flex items-center justify-between gap-4">
          <dt className="text-mute">UPI ID</dt>
          <dd className="flex min-w-0 items-center gap-1.5">
            <span className="truncate font-mono text-[13px]" translate="no">
              {upi.pa}
            </span>
            <button type="button" onClick={copy} aria-label="Copy UPI ID" className="grid size-7 place-items-center rounded-lg text-mute transition hover:bg-soft hover:text-ink">
              <Copy className="size-3.5" />
            </button>
          </dd>
        </div>
        {ref && (
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-mute">Ref</dt>
            <dd className="font-mono text-[13px]">{ref}</dd>
          </div>
        )}
        {upi.tn && (
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-mute">Note</dt>
            <dd className="text-right font-medium">{upi.tn}</dd>
          </div>
        )}
      </dl>
      {order && (
        <p className="mt-4 border-t border-dashed border-line pt-3 text-[12px] leading-relaxed text-mute">
          Order details come from whoever sent this link and aren’t verified. The payment goes to the UPI ID above.
        </p>
      )}
    </Section>
  );
}
