import { ImageResponse } from "next/og";
import { Mark } from "@/lib/mark";
import { OG_FONTS } from "@/lib/ogFonts";
import { SITE } from "@/lib/site";

export const alt = `${SITE.name}: ${SITE.title}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Landing share card: headline on the left, a mini pay page on the right. */
export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        padding: "0 72px",
        gap: 56,
        fontFamily: "Geist",
        color: "#16150f",
        background: "radial-gradient(120% 90% at 85% 10%, #e3f5ea 0%, #f3f2ee 55%)",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 34, fontWeight: 700 }}>
          <Mark size={56} /> {SITE.name}
        </div>
        <div style={{ marginTop: 40, fontSize: 62, fontWeight: 800, letterSpacing: -2.5, lineHeight: 1.02, display: "flex", flexDirection: "column" }}>
          <span>Your agent shops.</span>
          <span style={{ color: "#0b9a5c" }}>You pay with one tap.</span>
        </div>
        <div style={{ marginTop: 28, fontSize: 28, color: "#6b675e", lineHeight: 1.35 }}>
          UPI QR + cart → a pay page that opens GPay, PhonePe or Paytm pre-filled.
        </div>
        <div style={{ marginTop: 32, display: "flex", gap: 12, fontSize: 22, fontWeight: 600 }}>
          {["MCP", "HTTP API", "No keys"].map((t) => (
            <span key={t} style={{ padding: "8px 18px", borderRadius: 999, background: "#16150f", color: "#f5f4f0" }}>
              {t}
            </span>
          ))}
        </div>
      </div>
      <div
        style={{
          width: 330,
          height: 520,
          borderRadius: 48,
          background: "#16150f",
          padding: 10,
          display: "flex",
          boxShadow: "0 40px 80px rgba(22,21,15,.28)",
        }}
      >
        <div style={{ flex: 1, borderRadius: 40, background: "#f3f2ee", display: "flex", flexDirection: "column", padding: "48px 22px 22px" }}>
          <div style={{ fontSize: 15, letterSpacing: 3, color: "#6b675e", fontWeight: 600 }}>REVIEW & PAY</div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>Blinkit order</div>
          <div style={{ fontSize: 76, fontWeight: 800, letterSpacing: -3, marginTop: 26, textAlign: "center", justifyContent: "center", display: "flex" }}>₹642</div>
          <div style={{ fontSize: 17, color: "#067647", fontWeight: 600, display: "flex", justifyContent: "center" }}>7 items · ₹14 saved</div>
          <div style={{ marginTop: 24, background: "#fff", borderRadius: 20, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            {[["Amul Taaza Milk", "₹168"], ["Hass Avocado", "₹149"], ["Attikan Coffee", "₹245"]].map(([n, p]) => (
              <div key={n} style={{ display: "flex", justifyContent: "space-between", fontSize: 17 }}>
                <span>{n}</span>
                <span style={{ fontWeight: 700 }}>{p}</span>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: "auto",
              height: 60,
              borderRadius: 18,
              background: "#16150f",
              color: "#f5f4f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 20px",
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            <span>₹642</span>
            <span>Pay now ›</span>
          </div>
        </div>
      </div>
    </div>,
    { ...size, fonts: OG_FONTS },
  );
}
