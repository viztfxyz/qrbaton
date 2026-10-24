import type { NextConfig } from "next";

const security = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
];

const config: NextConfig = {
  poweredByHeader: false,
  // OG images read these fonts from disk at runtime.
  outputFileTracingIncludes: { "/og": ["./assets/fonts/*"], "/p/*/opengraph-image": ["./assets/fonts/*"], "/opengraph-image": ["./assets/fonts/*"] },
  turbopack: { root: import.meta.dirname },
  async headers() {
    return [
      { source: "/:path*", headers: [...security, { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }] },
      // Session pages carry an order and delivery address: never index, never leak the URL via Referer.
      {
        source: "/p/:id",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "private, no-store" },
        ],
      },
    ];
  },
};

export default config;
