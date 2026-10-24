/** The scan-corners mark with a "paid" dot, for ImageResponse (icons, OG). */
export function Mark({ size }: { size: number }) {
  const r = size * 0.28;
  return (
    <div style={{ width: size, height: size, borderRadius: r, background: "#16150f", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" stroke="#f5f4f0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10" />
      </svg>
      <div
        style={{
          position: "absolute",
          right: -size * 0.02,
          bottom: -size * 0.02,
          width: size * 0.3,
          height: size * 0.3,
          borderRadius: size,
          background: "#0b9a5c",
          border: `${Math.max(2, size * 0.05)}px solid #f3f2ee`,
        }}
      />
    </div>
  );
}
