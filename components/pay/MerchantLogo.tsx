import { findBrand } from "@/lib/brands";
import { cn } from "@/lib/cn";
import { initial } from "@/lib/upi";

/** Merchant tile: explicit logo URL, else a known brand, else the name's initial. */
export function MerchantLogo({ name, logo, className }: { name: string; logo?: string; className?: string }) {
  const box = cn("grid size-11 shrink-0 place-items-center overflow-hidden rounded-2xl shadow-[0_0_0_1px_rgb(22_21_15/0.06)]", className);
  if (logo) {
    // biome-ignore lint: merchant-supplied logo URL
    return <img src={logo} alt="" referrerPolicy="no-referrer" className={cn(box, "bg-white object-contain")} />;
  }
  const b = findBrand(name);
  if (!b) return <span className={cn(box, "bg-ink text-lg font-bold text-canvas")}>{initial(name)}</span>;
  return (
    <span aria-hidden="true" className={box} style={{ background: b.bg }}>
      {b.path ? (
        <svg viewBox="0 0 24 24" className="size-[56%]" fill={b.fg}>
          <path d={b.path} />
        </svg>
      ) : (
        <span className="text-[10.5px] leading-none font-extrabold tracking-[-0.04em]">
          {b.word?.map(([t, c]) => (
            <span key={t} style={{ color: c }}>
              {t}
            </span>
          ))}
        </span>
      )}
    </span>
  );
}
