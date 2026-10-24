import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { SITE, siteUrl } from "@/lib/site";
import "./globals.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-geist" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: `${SITE.name} · ${SITE.title}`, template: `%s · ${SITE.name}` },
  description: SITE.description,
  keywords: SITE.keywords,
  applicationName: SITE.name,
  openGraph: { type: "website", siteName: SITE.name, title: SITE.title, description: SITE.description, url: "/", locale: "en_IN" },
  twitter: { card: "summary_large_image", title: SITE.title, description: SITE.description },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f2ee" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0d0b" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${sans.variable} ${mono.variable}`}>
      <body>
        {children}
        <Toaster position="top-center" theme="system" richColors={false} toastOptions={{ className: "!rounded-2xl !font-sans" }} />
      </body>
    </html>
  );
}
