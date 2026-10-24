import type { Metadata } from "next";
import { Landing } from "@/components/landing/Landing";
import { PayView } from "@/components/PayView";
import { FAQ, SITE, siteUrl } from "@/lib/site";
import { amountOf, formatMoney, parseUpi } from "@/lib/upi";

type Search = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: Search }): Promise<Metadata> {
  const upi = parseUpi(await searchParams);
  if (!upi) {
    return { alternates: { canonical: "/" } };
  }
  const am = amountOf(upi);
  const who = upi.pn || upi.pa;
  const title = am !== null ? `Pay ${formatMoney(am, upi.cu)} to ${who}` : `Pay ${who}`;
  return {
    title,
    robots: { index: false, follow: false },
    openGraph: { title, description: "Tap to pay with GPay, PhonePe, Paytm or any UPI app.", images: [`/og?${upi.qs}`] },
    twitter: { card: "summary_large_image" },
  };
}

/** Structured data for search engines: the app, plus the FAQ shown on the page. */
function JsonLd() {
  const url = siteUrl();
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: SITE.name,
      description: SITE.description,
      url,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web, Android, iOS",
      offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];
  // biome-ignore lint: static JSON-LD built from constants
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export default async function Page({ searchParams }: { searchParams: Search }) {
  const upi = parseUpi(await searchParams);
  if (upi) return <PayView upi={upi} />;
  return (
    <>
      <JsonLd />
      <Landing />
    </>
  );
}
