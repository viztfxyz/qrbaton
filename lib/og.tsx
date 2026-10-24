import { ImageResponse } from "next/og";
import { findBrand } from "./brands";
import { OG_FONTS } from "./ogFonts";
import { initial } from "./upi";

export const OG_SIZE = { width: 1200, height: 630 };

function Tile({ name }: { name: string }) {
  const b = findBrand(name);
  const box = { width: 96, height: 96, borderRadius: 32, display: "flex", alignItems: "center", justifyContent: "center" } as const;
  if (!b) return <div style={{ ...box, background: "#f6f5f2", fontSize: 44, fontWeight: 700 }}>{initial(name)}</div>;
  return (
    <div style={{ ...box, background: b.bg }}>
      {b.path ? (
        <svg width="54" height="54" viewBox="0 0 24 24" fill={b.fg}>
          <path d={b.path} />
        </svg>
      ) : (
        <div style={{ display: "flex", fontSize: 22, fontWeight: 800, letterSpacing: -1 }}>
          {b.word?.map(([t, c]) => (
            <span key={t} style={{ color: c }}>
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** Link-preview card: who you're paying, how much, and a short subtitle. No address. */
export function ogCard({ eyebrow, title, amount, sub, logoName }: { eyebrow: string; title: string; amount?: string; sub: string; logoName?: string }) {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(140% 70% at 50% -10%, #fffdf8, #f3f2ef 60%)",
        fontFamily: "Geist",
        color: "#1a1916",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: 760,
          padding: "56px 48px",
          borderRadius: 56,
          background: "#fff",
          boxShadow: "0 0 0 2px rgba(26,25,22,.05), 0 36px 80px rgba(26,25,22,.10)",
        }}
      >
        <Tile name={logoName ?? title} />
        <div style={{ marginTop: 24, fontSize: 22, letterSpacing: 4, textTransform: "uppercase", color: "#5e5954" }}>
          {eyebrow}
        </div>
        <div style={{ marginTop: 6, fontSize: 40, fontWeight: 700, maxWidth: 660, textAlign: "center" }}>{title}</div>
        {amount && <div style={{ marginTop: 16, fontSize: 112, fontWeight: 800, letterSpacing: -4 }}>{amount}</div>}
        <div style={{ marginTop: 18, fontSize: 26, color: "#5e5954" }}>{sub}</div>
      </div>
    </div>,
    { ...OG_SIZE, fonts: OG_FONTS },
  );
}
