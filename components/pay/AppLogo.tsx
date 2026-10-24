import { siGooglepay, siPaytm, siPhonepe } from "simple-icons";
import { cn } from "@/lib/cn";
import type { AppKey } from "@/lib/upi";

const BRAND: Record<AppKey, { hex: string; path?: string }> = {
  g: { hex: `#${siGooglepay.hex}`, path: siGooglepay.path },
  p: { hex: `#${siPhonepe.hex}`, path: siPhonepe.path },
  t: { hex: "#00BAF2", path: siPaytm.path },
  u: { hex: "#16150f" },
};

export const brandColor = (k: AppKey) => BRAND[k].hex;

/** Rounded brand tile for a UPI app. "Other" gets a rupee mark. */
export function AppLogo({ k, className }: { k: AppKey; className?: string }) {
  const b = BRAND[k];
  return (
    <span
      aria-hidden="true"
      className={cn("grid size-10 shrink-0 place-items-center rounded-xl bg-white shadow-[0_0_0_1px_rgb(22_21_15/0.08)]", className)}
    >
      {b.path ? (
        <svg viewBox="0 0 24 24" className="size-[62%]" fill={b.hex}>
          <path d={b.path} />
        </svg>
      ) : (
        <span className="text-lg font-semibold text-[#16150f]">₹</span>
      )}
    </span>
  );
}
