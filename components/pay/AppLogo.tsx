import { siGooglepay, siPaytm, siPhonepe } from "simple-icons";
import { cn } from "@/lib/cn";
import type { AppKey } from "@/lib/upi";

/** CRED shield mark (from cred.club; simple-icons has no CRED glyph). */
const CRED_PATH =
  "M36.9957 57.4618C36.6778 57.4628 36.3652 57.3812 36.0889 57.225L12.5222 44.0271C12.2371 43.8671 11.9999 43.6345 11.835 43.3533C11.6701 43.072 11.5834 42.7521 11.5839 42.4266V1.83446C11.5839 1.34793 11.7783 0.88133 12.1243 0.537302C12.4703 0.193273 12.9396 0 13.429 0H60.5595C61.0489 0 61.5182 0.193273 61.8642 0.537302C62.2102 0.88133 62.4046 1.34793 62.4046 1.83446V42.4266C62.4051 42.7521 62.3184 43.072 62.1535 43.3533C61.9887 43.6345 61.7514 43.8671 61.4663 44.0271L37.8996 57.225C37.6242 57.3808 37.3126 57.4624 36.9957 57.4618ZM15.274 41.3681L36.9957 53.5332L58.7145 41.3681V3.66892H15.274V41.3681Z M36.9957 39.0858C36.678 39.0854 36.3658 39.0038 36.0889 38.849L28.6284 34.6665C28.3433 34.5069 28.106 34.2749 27.9406 33.9942C27.7752 33.7135 27.6878 33.3941 27.6872 33.0688V25.3915H31.3773V32.0132L36.9986 35.1515L43.5552 31.4769L45.3658 34.6722L37.9053 38.8547C37.6271 39.0081 37.3138 39.0877 36.9957 39.0858Z M36.9957 48.2752C36.678 48.2748 36.3658 48.1933 36.0889 48.0384L20.5739 39.3482C20.2891 39.1885 20.0522 38.9563 19.8873 38.6756C19.7225 38.3949 19.6356 38.0756 19.6356 37.7506V17.8425C19.6356 17.356 19.83 16.8894 20.176 16.5453C20.522 16.2013 20.9913 16.008 21.4806 16.008H44.2668V19.6855H23.3199V36.6864L36.99 44.3438L50.6571 36.6864V28.7323H54.3472V37.7506C54.3472 38.0756 54.2603 38.3949 54.0954 38.6756C53.9306 38.9563 53.6936 39.1885 53.4089 39.3482L37.8938 48.0384C37.6196 48.192 37.3104 48.2735 36.9957 48.2752Z M54.3529 21.7197H50.6628V11.6744H26.1664V8.00545H52.5108C53.0001 8.00545 53.4694 8.19872 53.8154 8.54275C54.1614 8.88678 54.3558 9.35338 54.3558 9.83991L54.3529 21.7197Z";

const BRAND: Record<AppKey, { hex: string; path?: string; viewBox?: string }> = {
  g: { hex: `#${siGooglepay.hex}`, path: siGooglepay.path },
  p: { hex: `#${siPhonepe.hex}`, path: siPhonepe.path },
  t: { hex: "#00BAF2", path: siPaytm.path },
  c: { hex: "#000000", path: CRED_PATH, viewBox: "8 0 58 58" },
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
        <svg viewBox={b.viewBox ?? "0 0 24 24"} className="size-[62%]" fill={b.hex}>
          <path d={b.path} />
        </svg>
      ) : (
        <span className="text-lg font-semibold text-[#16150f]">₹</span>
      )}
    </span>
  );
}
