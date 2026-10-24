"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

/** Crisp SVG QR code, rendered on the client. */
export function QrCode({ value, className }: { value: string; className?: string }) {
  const [svg, setSvg] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    void QRCode.toString(value, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#16150f", light: "#0000" } }).then(
      (s) => live && setSvg(s),
    );
    return () => {
      live = false;
    };
  }, [value]);
  return (
    <div
      role="img"
      aria-label="QR code"
      className={cn("aspect-square [&>svg]:size-full", !svg && "animate-pulse rounded-xl bg-soft", className)}
      // biome-ignore lint: SVG generated locally by the qrcode package
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
    />
  );
}
